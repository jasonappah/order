export interface RequiredField {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'url' | 'email';
  description?: string;
}

export const REQUIRED_FIELDS: RequiredField[] = [
  { key: 'name', label: 'Name', required: true, type: 'string', description: 'Product or item name' },
  { key: 'vendor', label: 'Vendor', required: true, type: 'string', description: 'Supplier or vendor name' },
  { key: 'partNumber', label: 'Part #', required: false, type: 'string', description: 'Part number or SKU' },
  { key: 'link', label: 'Link', required: true, type: 'url', description: 'Product URL or link' },
  { key: 'pricePerUnit', label: 'Price per Unit', required: true, type: 'number', description: 'Unit price in dollars' },
  { key: 'quantity', label: 'Quantity', required: true, type: 'number', description: 'Number of items' },
  { key: 'tax', label: 'Tax', required: false, type: 'number', description: 'Tax amount in dollars' },
  { key: 'shippingHandling', label: 'S&H', required: false, type: 'number', description: 'Shipping and handling cost' },
  { key: 'total', label: 'TOTAL', required: false, type: 'number', description: 'Total cost including all fees' },
  { key: 'deliveryType', label: 'Delivery Type', required: false, type: 'string', description: 'Delivery method or type' },
  { key: 'notes', label: 'Notes', required: false, type: 'string', description: 'Additional notes or comments' }
];

// Fixed column order mapping (positions 0-10)
export const FIXED_COLUMN_ORDER = [
  'name',           // 0
  'vendor',         // 1  
  'partNumber',     // 2
  'link',           // 3
  'pricePerUnit',   // 4
  'quantity',       // 5
  'tax',            // 6
  'shippingHandling', // 7
  'total',          // 8
  'deliveryType',   // 9
  'notes'           // 10
];

export interface ColumnMapping {
  [requiredFieldKey: string]: string | null; // Maps required field key to header name
}

export interface MappingResult {
  mapping: ColumnMapping;
  unmappedHeaders: string[];
  missingRequired: RequiredField[];
  suggestions: { [headerName: string]: string[] };
}

/**
 * Creates a fixed column mapping based on predetermined column positions
 * No headers expected - uses fixed positional mapping
 */
export function createFixedColumnMapping(): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  // Map each field to its fixed position (simulated as position index)
  FIXED_COLUMN_ORDER.forEach((fieldKey, index) => {
    mapping[fieldKey] = `column_${index}`; // Use position identifier
  });

  return mapping;
}

/**
 * Legacy function for header-based mapping (kept for compatibility)
 * @deprecated Use createFixedColumnMapping instead
 */
export function createColumnMapping(): MappingResult {
  const mapping = createFixedColumnMapping();
  
  return {
    mapping,
    unmappedHeaders: [],
    missingRequired: [],
    suggestions: {}
  };
}




/**
 * Updates mapping with user selection
 */
export function updateMapping(
  currentMapping: ColumnMapping, 
  fieldKey: string, 
  headerName: string | null
): ColumnMapping {
  const newMapping = { ...currentMapping };
  
  // Remove previous mapping for this header if it exists
  if (headerName) {
    for (const key of Object.keys(newMapping)) {
      if (newMapping[key] === headerName) {
        newMapping[key] = null;
      }
    }
  }
  
  newMapping[fieldKey] = headerName;
  return newMapping;
}

/**
 * Validates that all required fields are mapped
 */
export function validateMapping(mapping: ColumnMapping): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of REQUIRED_FIELDS) {
    if (field.required && !mapping[field.key]) {
      errors.push(`Required field "${field.label}" is not mapped`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 