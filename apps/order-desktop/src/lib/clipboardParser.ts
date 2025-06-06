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
    headers: ['Name', 'Vendor', 'Part #', 'Link', 'Price per Unit', 'Quantity', 'Tax', 'S&H', 'TOTAL', 'Delivery Type', 'Notes'],
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
 */
function parseTabSeparatedLine(line: string): string[] {
  if (!line) return [];
  
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      // Start of quoted value
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      // Check for escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        // End of quoted value
        inQuotes = false;
      }
    } else if (char === '\t' && !inQuotes) {
      // Tab separator outside quotes
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add final value
  values.push(current.trim());
  
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

/**
 * Gets suggestions for column mapping based on common variations
 */
export function getColumnSuggestions(headerName: string): string[] {
  const normalized = normalizeColumnName(headerName);
  
  const suggestions: { [key: string]: string[] } = {
    'priority': ['priority', 'pri', 'importance', 'order'],
    'classification': ['classification', 'class', 'category', 'type'],
    'name': ['name', 'title', 'item', 'product', 'description'],
    'vendor': ['vendor', 'supplier', 'company', 'manufacturer'],
    'partnumber': ['partnumber', 'partno', 'part', 'sku', 'model'],
    'link': ['link', 'url', 'website', 'source'],
    'priceperunit': ['priceperunit', 'price', 'unitprice', 'cost'],
    'quantity': ['quantity', 'qty', 'amount', 'count'],
    'tax': ['tax', 'taxes', 'vat'],
    'shippinghandling': ['shippinghandling', 'shipping', 'sh', 'freight'],
    'total': ['total', 'sum', 'amount', 'cost'],
    'deliverytype': ['deliverytype', 'delivery', 'shipping', 'method'],
    'notes': ['notes', 'comments', 'remarks', 'description']
  };

  for (const [standardName, variations] of Object.entries(suggestions)) {
    if (variations.includes(normalized)) {
      return [standardName];
    }
  }

  return [];
} 