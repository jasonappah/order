import { PDFDocument, PDFTextField } from "pdf-lib";
import { formatCentsAsDollarString, formatDate } from "./utilities";

const purchaseFormDataKeyToPdfFormFieldName: Record<
	Exclude<keyof GeneratePurchaseFormPDFInput, "studentSignatureImgUrl">,
	string
> = {
	orgName: "Organization Name",
	contactName: "Contact Name First Last",
	contactPhone: "Contact Phone Number",
	contactEmail: "Contact UTD email",
	eventName: "Event Name if applicable",
	eventDate: "Event Date if applicable",
	expectedAttendance: "Expected Attendance if applicable",
	businessJustification: "Text10",
	studentSignatureDate: "Date1_af_date",
	totalQuoteCostCents: "Total Quote Cost excluding sales tax",
} as const;

const purchaseFormDataKeyToStringFormatter = {
	totalQuoteCostCents: formatCentsAsDollarString,
	studentSignatureDate: formatDate,
} satisfies Partial<{
	[key in keyof GeneratePurchaseFormPDFInput]: (
		value: GeneratePurchaseFormPDFInput[key],
	) => string;
}>;

type GeneratePurchaseFormPDFInput = {
	orgName: string;
	contactName: string;
	contactPhone: string;
	contactEmail: string;
	eventName?: string;
	eventDate?: string;
	expectedAttendance?: string;
	businessJustification: string;
	studentSignatureDate: Date;
	totalQuoteCostCents: number;
};


/**
 * @platform node
 * @returns The bytes of the purchase form PDF
 */
export const resolvePurchaseFormPdfOnServer: PurchaseFormPDFResolver = async () => {
	if (globalThis.window) {
		throw new Error("Need to pass in a browser-compatible `purchaseFormPdfResolver` to `generatePurchaseFormPDF` to run in a browser. This resolver implementation will not work in a browser due to use of `node:fs/promises`.")
	}
	const readFile = await import("node:fs/promises").then(m => m.readFile)
	return readFile(`${__dirname}/../../../resources/Jonsson School Student Organization Purchase Form.pdf`)
}

export type PurchaseFormPDFResolver = () => Promise<Parameters<typeof PDFDocument.load>[0]>

export async function generatePurchaseFormPDF(
	data: GeneratePurchaseFormPDFInput,
	purchaseFormPdfResolver: PurchaseFormPDFResolver,
) {
	const existingPdfBytes = await purchaseFormPdfResolver()
	
	const pdfDoc = await PDFDocument.load(existingPdfBytes);

	const form = pdfDoc.getForm();

	for (const [key, value] of Object.entries(data)) {
		if (!(key in purchaseFormDataKeyToPdfFormFieldName)) {
			continue;
		}
		const fieldName =
			purchaseFormDataKeyToPdfFormFieldName[
				key as keyof typeof purchaseFormDataKeyToPdfFormFieldName
			];

		const field = form.getField(fieldName);
		if (!(field instanceof PDFTextField)) {
			throw new Error(`field ${fieldName} is not a PDFTextField`);
		}
		const formatter =
			purchaseFormDataKeyToStringFormatter[
				key as keyof typeof purchaseFormDataKeyToStringFormatter
			];

		field.setText(formatter ? formatter(value as any) : value.toString());
	}

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}
