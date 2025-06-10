import { PDFDocument, PDFTextField } from "pdf-lib";
import fs from "node:fs/promises";
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

export async function generatePurchaseFormPDF(
	data: GeneratePurchaseFormPDFInput,
) {
	// TODO: Figure out alternative to this - won't work in browser...
	const existingPdfBytes = await fs.readFile(
		`${__dirname}/../Jonsson School Student Organization Purchase Form.pdf`,
	);
	
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
