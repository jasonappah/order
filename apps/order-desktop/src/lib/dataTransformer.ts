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
      const deliveryType = row[headers[9]] || '';
      const notes = row[headers[10]] || '';

      // Validate required fields
      if (!name || !vendor || !quantity || Number.isNaN(pricePerUnit) || !link) {
        throw new Error(`Row ${index + 1}: Missing required fields (name, vendor, quantity, or price)`);
      }

      // Create the OrderLineItem
      const orderItem: OrderLineItem = {
        name: `${name}${partNumber ? ` (${partNumber})` : ''}`, // Include part number in name
        vendor: vendor.trim(),
        quantity: quantity,
        url: cleanAmazonUrl(link),
        pricePerUnitCents: Math.round(pricePerUnit * 100), // Convert to cents
        shippingAndHandlingCents: Math.round(shippingHandling * 100), // Convert to cents
        notes: [
          partNumber ? `Part #: ${partNumber}` : '',
          deliveryType ? `Delivery: ${deliveryType}` : '',
          tax > 0 ? `Tax: $${tax.toFixed(2)}` : '',
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


// TODO: later, move this into the order-form package. tbh a lot of the stuff that cursor did should be in the order-form package.
/**
 * Cleans Amazon URLs by removing query parameters while preserving the essential product path
 * @param url The Amazon URL to clean
 * @returns Cleaned URL without query parameters, or original URL if not an Amazon URL
 */
export function cleanAmazonUrl(url: string): string {
  // console.log('Cleaning Amazon URL:', url);
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.match(/^(www\.)?amazon\.com$/)) {
      return url; 
    }

    urlObj.search = ""
    urlObj.hash = ""

    return urlObj.toString()
  } catch (error) {
    return url;
  }
}
