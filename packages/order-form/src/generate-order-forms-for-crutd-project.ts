// TODO: separate out CRUTD stuff from the general order form stuff

import { PDFDocument } from "pdf-lib";
import { generateOrderListPDF } from "./generate-order-list-pdf";
import { generatePurchaseFormPDF, type PurchaseFormPDFResolver } from "./generate-purchase-form-pdf";
import type { GeneratedPDF, OrderLineItem } from "./types";
import { calculateTotalCents, generatePdfName, groupItemsByVendor } from "./utilities";

type GenerateOrderFormsInput = {
	items: OrderLineItem[];
	justification?: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	project: string;
	orgName: string;
	requestDate?: Date;
};

type GenerateOrderFormsForCRUTDProjectInput = Omit<GenerateOrderFormsInput, "justification" | "orgName"> & {
	project: CometProject;
	justification?: {
		replace: string;
	} | {append: string};
};

const cometProjects = {
	// key is the name of the project name as used in their sheet name on the CRUTD Master Orderlist spreadsheet (usually an abbreviation)
	// value is the full display name of the project
	General: "General",
	Marketing: "Marketing",
	"Full Combat": "Full Combat Robots (Ants, Beetles, etc.)",
	Plant: "Plant Combat Robots",
	Sumo: "SumoBots",
	VexU: "VEX U",
	ChessBots: "ChessBots",
	SRP: "Solis Rover Project",
} as const;

const generalJustification = 'These parts are needed for continued research and development on club projects.' as const;

export type CometProject = keyof typeof cometProjects;

export async function generateOrderFormsForCRUTDProject(
	data: GenerateOrderFormsForCRUTDProjectInput,
	purchaseFormPdfResolver: PurchaseFormPDFResolver,
) {
	const projectName = cometProjects[data.project];
	let justification = `These parts are needed for the ${projectName} team to continue research and development on their project.`;
	if (data.justification) {
		if ("replace" in data.justification) {
			justification = data.justification.replace;
		} else {
			justification += `\n\n${data.justification.append}`;
		}
	}


	return generateOrderForms({
		...data,
		justification,
		project: projectName,
		orgName: "Comet Robotics",
	}, purchaseFormPdfResolver);
}


export async function generateOrderForms(
	data: GenerateOrderFormsInput,
	purchaseFormPdfResolver: PurchaseFormPDFResolver,
) {
	const requestDate = data.requestDate ?? new Date();
	const businessJustification = data.justification ?? generalJustification;
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
			}),
	);
	const orderLists = await Promise.all(orderListPromises.map((p) => p()));

	

	const mergedOrderForms: GeneratedPDF[] = [];
	for (const orderList of orderLists) {
		const [orderListPdfDoc, purchaseFormPdfDoc] = await Promise.all([
			PDFDocument.load(orderList.orderListPdf), 
			PDFDocument.load(orderList.purchaseFormPdf)
		]);

		const merged = await mergePDFs([purchaseFormPdfDoc, orderListPdfDoc]);
		mergedOrderForms.push({...orderList, pdfBuffer: await merged.save(), filename: generatePdfName(data.project, orderList.vendor, requestDate, data.orgName), itemCount: orderList.items.length});
	}

	return mergedOrderForms;
}

async function mergePDFs(pdfDocs: PDFDocument[]) {
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
