import type { GeneratedPDF, OrderLineItem } from '../../../../packages/order-form/src/types';
import { groupItemsByVendor } from '../../../../packages/order-form/src/utilities';
import { open } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

/**
 * Downloads all PDFs as individual files
 */
export async function downloadAllPDFs(pdfs: GeneratedPDF[]): Promise<void> {
  const folder = await open({
    directory: true,
    title: "Select a folder to save the PDFs to"
  })
  console.log("folder", folder)
  if (!folder) {
    return
  }
  for (const pdf of pdfs) {
    await writeFile(folder + "/" + pdf.filename, pdf.pdfBuffer, {
      createNew: true,
    })
  }
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