import type { OrderLineItem } from '../../../../packages/order-form/src/types';
import { generateOrderListPDF } from '../../../../packages/order-form/src/generate-order-list-pdf';
import { groupOrderItemsByVendor } from './dataTransformer';

export interface PDFGenerationOptions {
  projectName: string;
  businessJustification?: string;
  requestDate?: Date;
}

export interface GeneratedPDF {
  vendor: string;
  pdfBuffer: Uint8Array;
  itemCount: number;
  filename: string;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfs: GeneratedPDF[];
  errors: string[];
}

/**
 * Generates order list PDFs grouped by vendor
 */
export async function generateOrderPDFs(
  items: OrderLineItem[],
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const result: PDFGenerationResult = {
    success: false,
    pdfs: [],
    errors: []
  };

  try {
    // Group items by vendor
    const itemsByVendor = groupOrderItemsByVendor(items);
    const vendors = Object.keys(itemsByVendor);

    if (vendors.length === 0) {
      result.errors.push('No vendors found in the data');
      return result;
    }

    // Generate PDF for each vendor
    const pdfPromises = vendors.map(async (vendor) => {
      try {
        const vendorItems = itemsByVendor[vendor] || [];
        const requestDate = options.requestDate || new Date();
        
        const pdfBuffer = await generateOrderListPDF({
          projectName: options.projectName,
          businessJustification: options.businessJustification || `Order for ${options.projectName} project`,
          requestDate,
          items: vendorItems,
          vendor
        });

        const filename = generatePdfFilename(options.projectName, vendor, requestDate);

        return {
          vendor,
          pdfBuffer,
          itemCount: vendorItems.length,
          filename
        };
      } catch (error) {
        console.error(`Error generating PDF for vendor ${vendor}:`, error);
        result.errors.push(`Failed to generate PDF for ${vendor}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    });

    // Wait for all PDFs to complete
    const pdfResults = await Promise.all(pdfPromises);
    
    // Filter out failed generations
    result.pdfs = pdfResults.filter((pdf): pdf is GeneratedPDF => pdf !== null);
    
    // Mark as successful if we have at least one PDF
    result.success = result.pdfs.length > 0;

    if (result.pdfs.length === 0) {
      result.errors.push('No PDFs could be generated successfully');
    }

  } catch (error) {
    console.error('Error in PDF generation:', error);
    result.errors.push(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

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
 * Generates a standardized filename for the PDF
 */
function generatePdfFilename(projectName: string, vendor: string, date: Date): string {
  const dateStr = date.toLocaleDateString('en-US').replace(/\//g, '-');
  const sanitizedProject = projectName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const sanitizedVendor = vendor.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  return `${sanitizedProject}_${sanitizedVendor}_${dateStr}.pdf`;
}

/**
 * Preview function to validate PDF generation without actually generating
 */
export function previewPDFGeneration(items: OrderLineItem[]): {
  vendorCount: number;
  vendors: string[];
  totalItems: number;
} {
  const itemsByVendor = groupOrderItemsByVendor(items);
  const vendors = Object.keys(itemsByVendor);
  
  return {
    vendorCount: vendors.length,
    vendors,
    totalItems: items.length
  };
} 