import type { GeneratedPDF, OrderLineItem } from '../../../../packages/order-form/src/types';
import { groupItemsByVendor } from '../../../../packages/order-form/src/utilities';

/**
 * Downloads a PDF file to the user's device
 */
export function downloadPDF(pdf: GeneratedPDF): void {
  try {
    const blob = new Blob([pdf.pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = pdf.filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
}

/**
 * Downloads all PDFs as individual files
 */
export function downloadAllPDFs(pdfs: GeneratedPDF[]): void {
  pdfs.forEach((pdf, index) => {
    // Add a small delay between downloads to avoid browser blocking
    setTimeout(() => {
      downloadPDF(pdf);
    }, index * 500);
  });
}

/**
 * Preview function to validate PDF generation without actually generating
 */
export function previewPDFGeneration(items: OrderLineItem[]): {
  vendorCount: number;
  vendors: string[];
  totalItems: number;
} {
  const itemsByVendor = groupItemsByVendor(items);
  const vendors = Object.keys(itemsByVendor);
  
  return {
    vendorCount: vendors.length,
    vendors,
    totalItems: items.length
  };
} 