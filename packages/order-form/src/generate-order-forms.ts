import { PDFDocument } from "pdf-lib";
import { generateOrderListPDF } from "./generate-order-list-pdf";
import { type PurchaseFormPDFResolver, generatePurchaseFormPDF } from "./generate-purchase-form-pdf";
import type { GeneratedPDF, OrderLineItem } from "./types";
import { groupItemsByVendor, calculateTotalCents, generatePdfName } from "./utilities";

const generalJustification = 'These parts are needed for continued research and development on club projects.' as const;

export type GenerateOrderFormsInput = {
	items: OrderLineItem[];
	justification?: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	project?: string
	orgName: string;
	requestDate?: Date;
};

export const resolveFinalConfig = (data: GenerateOrderFormsInput) => {
	const requestDate = data.requestDate ?? new Date();
	const businessJustification = data.justification ?? generalJustification;

	return {
		requestDate,
		businessJustification,
	}
}

export async function generateOrderForms(
	data: GenerateOrderFormsInput,
	purchaseFormPdfResolver: PurchaseFormPDFResolver
) {
	const { requestDate, businessJustification } = resolveFinalConfig(data);
	const itemsGroupedByVendor = groupItemsByVendor(data.items);

	const orderListPromises = Object.entries(itemsGroupedByVendor).map(
		([vendor, items]) =>
			async () => ({
				orderListPdf: await generateOrderListPDF({
					requestDate,
					items,
					vendor,
				}),
				purchaseFormPdf: await generatePurchaseFormPDF({
					orgName: data.orgName,
					contactName: data.contactName,
					contactEmail: data.contactEmail,
					contactPhone: data.contactPhone,
					businessJustification,
					studentSignatureDate: requestDate,
					totalQuoteCostCents: calculateTotalCents(items),
				}, purchaseFormPdfResolver),
				vendor,
				projectName: data.project,
				requestDate,
				items
			})
	);
	const orderLists = await Promise.all(orderListPromises.map((p) => p()));

	const mergedDocuments: GeneratedPDF[] = [];
	for (const orderList of orderLists) {
		const [orderListPdfDoc, purchaseFormPdfDoc] = await Promise.all([
			PDFDocument.load(orderList.orderListPdf),
			PDFDocument.load(orderList.purchaseFormPdf)
		]);

		const merged = await mergePDFs([purchaseFormPdfDoc, orderListPdfDoc]);
		mergedDocuments.push({ 
			...orderList, 
			pdfBuffer: await merged.save(), 
			filename: generatePdfName(orderList.vendor, requestDate, data.orgName, data.project), 
			itemCount: orderList.items.length 
		});
	}

	return mergedDocuments;
}


export async function mergePDFs(pdfDocs: PDFDocument[]) {
	if (pdfDocs.length === 0) {
		throw new Error("No PDF documents provided");
	}
	const mergedPdfDoc = pdfDocs[0]!;
	for (const pdfDoc of pdfDocs.slice(1)) {
		const copiedPages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
		for (const page of copiedPages) {
			mergedPdfDoc.addPage(page);
		}
	}
	return mergedPdfDoc;
}
