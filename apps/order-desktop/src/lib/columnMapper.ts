import { normalizeColumnName } from './clipboardParser';

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
 * Generates field variations for matching
 */
function getFieldVariations(field: RequiredField): string[] {
  const variations: { [key: string]: string[] } = {
    'priority': ['priority', 'pri', 'importance', 'order', 'rank'],
    'classification': ['classification', 'class', 'category', 'type', 'group'],
    'name': ['name', 'title', 'item', 'product', 'description', 'item name', 'product name'],
    'vendor': ['vendor', 'supplier', 'company', 'manufacturer', 'seller'],
    'partNumber': ['part number', 'part #', 'partnumber', 'partno', 'part', 'sku', 'model', 'model number'],
    'link': ['link', 'url', 'website', 'source', 'product link', 'product url'],
    'pricePerUnit': ['price per unit', 'priceperunit', 'price', 'unit price', 'unitprice', 'cost', 'unit cost'],
    'quantity': ['quantity', 'qty', 'amount', 'count', 'number', 'num'],
    'tax': ['tax', 'taxes', 'vat', 'tax amount'],
    'shippingHandling': ['shipping handling', 'shippinghandling', 'shipping', 'sh', 's&h', 'freight', 'shipping cost'],
    'total': ['total', 'sum', 'amount', 'total cost', 'grand total', 'final total'],
    'deliveryType': ['delivery type', 'deliverytype', 'delivery', 'shipping type', 'shipping method', 'method'],
    'notes': ['notes', 'comments', 'remarks', 'description', 'additional notes']
  };

  return variations[field.key] || [field.label.toLowerCase()];
}

/**
 * Generates suggestions for unmapped headers
 */
function generateSuggestions(header: string): string[] {
  const normalized = normalizeColumnName(header);
  const suggestions: string[] = [];

  REQUIRED_FIELDS.forEach(field => {
    const variations = getFieldVariations(field);
    const score = calculateSimilarity(normalized, variations);
    
    if (score > 0.3) { // Threshold for suggestions
      suggestions.push(field.key);
    }
  });

  // Sort by best match (could implement more sophisticated scoring)
  return suggestions.slice(0, 3); // Limit to top 3 suggestions
}

/**
 * Calculates similarity score between header and field variations
 */
function calculateSimilarity(header: string, variations: string[]): number {
  let maxScore = 0;

  variations.forEach(variation => {
    const normalized = normalizeColumnName(variation);
    let score = 0;

    // Exact match
    if (header === normalized) {
      score = 1.0;
    }
    // Contains match
    else if (header.includes(normalized) || normalized.includes(header)) {
      score = 0.7;
    }
    // Partial word match
    else {
      const headerWords = header.split(/\s+/);
      const variationWords = normalized.split(/\s+/);
      const commonWords = headerWords.filter(word => variationWords.includes(word));
      score = commonWords.length / Math.max(headerWords.length, variationWords.length);
    }

    maxScore = Math.max(maxScore, score);
  });

  return maxScore;
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
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === headerName) {
        newMapping[key] = null;
      }
    });
  }
  
  newMapping[fieldKey] = headerName;
  return newMapping;
}

/**
 * Validates that all required fields are mapped
 */
export function validateMapping(mapping: ColumnMapping): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  REQUIRED_FIELDS.forEach(field => {
    if (field.required && !mapping[field.key]) {
      errors.push(`Required field "${field.label}" is not mapped`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
} 