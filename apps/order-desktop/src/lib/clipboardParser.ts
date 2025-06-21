import { REQUIRED_FIELDS } from "./columnMapper";

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Parses tab-separated values from clipboard data using fixed column positions
 * No headers expected - data rows only
 * @param data Raw clipboard data as string
 * @returns ParseResult with fixed headers and rows
 */
export function parseClipboardData(data: string): ParseResult {
  const result: ParseResult = {
    headers: REQUIRED_FIELDS.map(field => field.label),
    rows: [],
    errors: [],
    warnings: []
  };

  if (!data || !data.trim()) {
    result.errors.push('No data provided');
    return result;
  }

  const lines = data.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    result.errors.push('No valid lines found in data');
    return result;
  }

  // Parse data rows (no header line expected)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const values = parseTabSeparatedLine(line);
    
    if (values.length === 0) {
      result.warnings.push(`Row ${i + 1}: Empty row skipped`);
      continue;
    }

    // Create row object mapping fixed column positions to values
    const row: ParsedRow = {};
    for (let j = 0; j < result.headers.length; j++) {
      const header = result.headers[j];
      const value = j < values.length ? values[j] : '';
      row[header] = value;
    }

    // Check for extra columns
    if (values.length > result.headers.length) {
      result.warnings.push(`Row ${i + 1}: Has ${values.length - result.headers.length} extra column(s) - they will be ignored`);
    }

    // Check for missing columns
    if (values.length < result.headers.length) {
      result.warnings.push(`Row ${i + 1}: Missing ${result.headers.length - values.length} column(s) - they will be empty`);
    }

    result.rows.push(row);
  }

  if (result.rows.length === 0) {
    result.errors.push('No data rows found');
  }

  return result;
}

/**
 * Parses a single line of tab-separated values
 * Handles quoted values and escaped characters
 * Supports quotes within unquoted text (like inches notation)
 */
function parseTabSeparatedLine(line: string): string[] {
  if (!line) return [];
  
  // State machine states
  enum State {
    START_FIELD = 0,      // Beginning of a new field
    IN_UNQUOTED = 1,      // Reading unquoted field content
    IN_QUOTED = 2,        // Reading quoted field content
    ESCAPE_QUOTE = 3      // Handling escaped quote in quoted field
  }
  
  const values: string[] = [];
  let current = '';
  let state = State.START_FIELD;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    switch (state) {
      case State.START_FIELD:
        if (char === '"') {
          // Start of quoted field
          state = State.IN_QUOTED;
        } else if (char === '\t') {
          // Empty field, move to next
          values.push('');
          state = State.START_FIELD;
        } else {
          // Start of unquoted field
          current += char;
          state = State.IN_UNQUOTED;
        }
        break;
        
      case State.IN_UNQUOTED:
        if (char === '\t') {
          // End of unquoted field
          values.push(current.trim());
          current = '';
          state = State.START_FIELD;
        } else {
          // Continue reading unquoted content
          current += char;
        }
        break;
        
      case State.IN_QUOTED:
        if (char === '"') {
          // Check for escaped quote
          if (i + 1 < line.length && line[i + 1] === '"') {
            state = State.ESCAPE_QUOTE;
          } else {
            // End of quoted field
            values.push(current.trim());
            current = '';
            state = State.START_FIELD;
          }
        } else {
          // Continue reading quoted content
          current += char;
        }
        break;
        
      case State.ESCAPE_QUOTE:
        // Add the escaped quote and continue in quoted state
        current += '"';
        state = State.IN_QUOTED;
        break;
    }
    
    i++;
  }
  
  // Handle final field
  if (state === State.START_FIELD && current === '') {
    // Empty field at end
    values.push('');
  } else {
    // Add final field content
    values.push(current.trim());
  }
  
  return values;
}

/**
 * Normalizes column names for better matching
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

