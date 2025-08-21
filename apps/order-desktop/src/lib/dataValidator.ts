import type { ParsedRow } from "./clipboardParser";
import type { RequiredField } from "./columnMapper";
import { REQUIRED_FIELDS } from "./columnMapper";

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: "error" | "warning";
  id: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRowCount: number;
  totalRowCount: number;
  id: string;
}

/**
 * Validates parsed data using fixed column positions
 */
export function validateData(rows: ParsedRow[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    validRowCount: 0,
    totalRowCount: rows.length,
    id: crypto.randomUUID(),
  };

  // Validate each row
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    let rowIsValid = true;

    REQUIRED_FIELDS.forEach((field) => {
      const headerName = field.label;
      const value = row[headerName] || "";
      const fieldValidation = validateFieldValue(value, field, rowNumber);

      for (const error of fieldValidation) {
        if (error.severity === "error") {
          result.errors.push(error);
          rowIsValid = false;
        } else {
          result.warnings.push(error);
        }
      }
    });

    if (rowIsValid) {
      result.validRowCount++;
    }
  });

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Validates a single field value against its requirements
 */
function validateFieldValue(
  value: string,
  field: RequiredField,
  rowNumber: number,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmedValue = value.trim();

  // Check required fields
  if (field.required && !trimmedValue) {
    errors.push({
      row: rowNumber,
      field: field.label,
      value,
      error: `Required field "${field.label}" is empty`,
      severity: "error",
      id: crypto.randomUUID(),
    });
    return errors; // No point validating type if empty and required
  }

  // Skip validation for empty optional fields
  if (!trimmedValue && !field.required) {
    return errors;
  }

  // Type validation
  const validNumber = isValidNumber(trimmedValue);
  switch (field.type) {
    case "number":
      if (!validNumber) {
        errors.push({
          row: rowNumber,
          field: field.label,
          value,
          error: `"${field.label}" must be a valid number`,
          severity: "error",
          id: crypto.randomUUID(),
        });
      } else {
        if (
          validNumber < 0 &&
          [
            "pricePerUnit",
            "quantity",
            "tax",
            "shippingHandling",
            "total",
          ].includes(field.key)
        ) {
          errors.push({
            row: rowNumber,
            field: field.label,
            value,
            error: `"${field.label}" cannot be negative`,
            severity: "error",
            id: crypto.randomUUID(),
          });
        }
      }
      break;

    case "url":
      if (trimmedValue && !isValidUrl(trimmedValue)) {
        errors.push({
          row: rowNumber,
          field: field.label,
          value,
          error: `"${field.label}" must be a valid URL`,
          severity: "warning",
          id: crypto.randomUUID(),
        });
      }
      break;

    case "string":
      if (trimmedValue.length > 500) {
        errors.push({
          row: rowNumber,
          field: field.label,
          value,
          error: `"${field.label}" is too long (max 500 characters)`,
          severity: "warning",
          id: crypto.randomUUID(),
        });
      }
      break;
  }

  // Field-specific validations
  if (field.key === "quantity" && validNumber) {
    const num = Number.parseFloat(trimmedValue);
    if (!Number.isNaN(num) && num !== Math.floor(num)) {
      errors.push({
        row: rowNumber,
        field: field.label,
        value,
        error: `"${field.label}" should be a whole number`,
        severity: "warning",
        id: crypto.randomUUID(),
      });
    }
  }

  if (field.key === "tax" && validNumber) {
    if (validNumber !== 0) {
      errors.push({
        row: rowNumber,
        field: field.label,
        value,
        error: `"${field.label}" has a non-zero value. ECS does not pay sales tax so this should be zero or empty.`,
        severity: "warning",
        id: crypto.randomUUID(),
      });
    }
  }
  
  return errors;
}

/**
 * Validates that a string represents a valid number
 */
function isValidNumber(value: string): number | null {
  if (!value.trim()) return null;

  // Remove common currency symbols and commas
  const cleaned = value.replace(/[$,\s]/g, "");

  const num = Number.parseFloat(cleaned);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return num;
  }
  
  return null;
}

/**
 * Validates that a string is a valid URL
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    // Try with http:// prefix if it doesn't have a protocol
    if (!value.includes("://")) {
      try {
        new URL(`https://${value}`);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    if (error.row === -1) {
      return error.error; // Mapping errors
    }
    return `Row ${error.row}: ${error.error}`;
  });
}

/**
 * Gets validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return `✅ All ${result.totalRowCount} rows are valid`;
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  let summary = "";
  if (errorCount > 0) {
    summary += `❌ ${errorCount} error${errorCount !== 1 ? "s" : ""}`;
  }
  if (warningCount > 0) {
    if (summary) summary += ", ";
    summary += `⚠️ ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;
  }

  summary += ` • ${result.validRowCount}/${result.totalRowCount} rows valid`;

  return summary;
}
