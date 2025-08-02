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
  { key: 'orderTotal', label: 'Order Total', required: false, type: 'string', description: 'Total cost including all fees. this field is not actually used in this app, but exists as a hidden column in the spreadsheet, so is here for copy paste ability' },
  { key: 'deliveryType', label: 'Delivery Type', required: false, type: 'string', description: 'Delivery method or type' },
  { key: 'notes', label: 'Notes', required: false, type: 'string', description: 'Additional notes or comments' }
];




