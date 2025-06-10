import type { OrderLineItem } from '../../../../packages/order-form/src/types';
import type { ParsedRow } from './clipboardParser';

/**
 * Transforms parsed table data into OrderLineItem format for PDF generation
 */
export function transformToOrderLineItems(rows: ParsedRow[]): OrderLineItem[] {
  const headers = ['Name', 'Vendor', 'Part #', 'Link', 'Price per Unit', 'Quantity', 'Tax', 'S&H', 'TOTAL', 'Delivery Type', 'Notes'];
  
  return rows.map((row, index) => {
    try {
      // Extract values from the row using our fixed column headers
      const name = row[headers[0]] || '';
      const vendor = row[headers[1]] || '';
      const partNumber = row[headers[2]] || '';
      const link = row[headers[3]] || '';
      const pricePerUnit = Number.parseFloat(row[headers[4]]?.replace(/[$,\s]/g, '') || '0');
      const quantity = Number.parseInt(row[headers[5]] || '1');
      const tax = Number.parseFloat(row[headers[6]]?.replace(/[$,\s]/g, '') || '0');
      const shippingHandling = Number.parseFloat(row[headers[7]]?.replace(/[$,\s]/g, '') || '0');
      const total = Number.parseFloat(row[headers[8]]?.replace(/[$,\s]/g, '') || '0');
      const deliveryType = row[headers[9]] || '';
      const notes = row[headers[10]] || '';

      // Validate required fields
      if (!name || !vendor || !quantity || Number.isNaN(pricePerUnit)) {
        throw new Error(`Row ${index + 1}: Missing required fields (name, vendor, quantity, or price)`);
      }

      // Create the OrderLineItem
      const orderItem: OrderLineItem = {
        name: `${name}${partNumber ? ` (${partNumber})` : ''}`, // Include part number in name
        vendor: vendor.trim(),
        quantity: quantity,
        url: link || '', // Use empty string if no URL provided
        pricePerUnitCents: Math.round(pricePerUnit * 100), // Convert to cents
        shippingAndHandlingCents: Math.round(shippingHandling * 100), // Convert to cents
        notes: [
          partNumber ? `Part #: ${partNumber}` : '',
          deliveryType ? `Delivery: ${deliveryType}` : '',
          tax > 0 ? `Tax: $${tax.toFixed(2)}` : '',
          total > 0 ? `Total: $${total.toFixed(2)}` : '',
          notes ? `Notes: ${notes}` : ''
        ].filter(Boolean).join(' | ') || undefined
      };

      return orderItem;
    } catch (error) {
      console.error(`Error transforming row ${index + 1}:`, error);
      throw error;
    }
  });
}

/**
 * Groups order items by vendor for PDF generation
 */
export function groupOrderItemsByVendor(items: OrderLineItem[]): Record<string, OrderLineItem[]> {
  return items.reduce((grouped, item) => {
    const vendor = item.vendor.trim();
    if (!grouped[vendor]) {
      grouped[vendor] = [];
    }
    grouped[vendor].push(item);
    return grouped;
  }, {} as Record<string, OrderLineItem[]>);
}

/**
 * Validates that the transformed data is suitable for PDF generation
 */
export function validateOrderLineItems(items: OrderLineItem[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  items.forEach((item, index) => {
    if (!item.name) {
      errors.push(`Item ${index + 1}: Missing name`);
    }
    if (!item.vendor) {
      errors.push(`Item ${index + 1}: Missing vendor`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (item.pricePerUnitCents < 0) {
      errors.push(`Item ${index + 1}: Price cannot be negative`);
    }
    if (item.shippingAndHandlingCents < 0) {
      errors.push(`Item ${index + 1}: Shipping cost cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates total cost for preview purposes
 */
export function calculateOrderTotal(items: OrderLineItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.pricePerUnitCents * item.quantity) + (item.shippingAndHandlingCents || 0);
  }, 0);
}

/**
 * Formats cents as dollar string for display
 */
export function formatCentsAsDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
} 