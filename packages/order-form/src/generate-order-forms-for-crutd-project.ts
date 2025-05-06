import { PDFDocument } from "pdf-lib";
import { generateOrderListPDF } from "./generate-order-list-pdf";
import { generatePurchaseFormPDF } from "./generate-purchase-form-pdf";
import type { OrderLineItem } from "./types";
import { calculateTotalCents, groupItemsByVendor } from "./utilities";

type GenerateOrderFormsForCRUTDProjectInput = {
	items: OrderLineItem[];
	project: CometProject;
	justification?: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
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
	ChessBot: "ChessBots",
	SRP: "Solis Rover Project",
} as const;

export type CometProject = keyof typeof cometProjects;

export async function generateOrderFormsForCRUTDProject(
	data: GenerateOrderFormsForCRUTDProjectInput,
) {
	let businessJustification = `These parts are needed for the ${cometProjects[data.project]} team to continue research and development on their project.`;
	if (data.justification) {
		businessJustification += `\n\n${data.justification}`;
	}

	const projectName = cometProjects[data.project];
	const totalQuoteCostCents = calculateTotalCents(data.items);
	const requestDate = new Date();

	const purchaseFormPDF = (
		await generatePurchaseFormPDF({
			orgName: "Comet Robotics",
			contactName: data.contactName,
			contactEmail: data.contactEmail,
			contactPhone: data.contactPhone,
			businessJustification,
			studentSignatureDate: requestDate,
			totalQuoteCostCents,
		})
	);

	const itemsGroupedByVendor = groupItemsByVendor(data.items);
	const orderListPromises = Object.entries(itemsGroupedByVendor).map(
		([vendor, items]) =>
			async () => ({
				pdf: await generateOrderListPDF({
					requestDate,
					items,
					projectName,
					businessJustification,
					vendor,
				}),
				vendor,
				projectName,
				requestDate,
			}),
	);
	const orderLists = await Promise.all(orderListPromises.map((p) => p()));

	const mergedOrderForms: {pdf: Uint8Array, vendor: string, projectName: string, requestDate: Date}[] = [];
	for (const orderList of orderLists) {
		const orderListPdfDoc = await PDFDocument.load(orderList.pdf);
		const merged = await mergePDFs([await PDFDocument.load(purchaseFormPDF), orderListPdfDoc]);
		mergedOrderForms.push({...orderList, pdf: await merged.save()});
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
