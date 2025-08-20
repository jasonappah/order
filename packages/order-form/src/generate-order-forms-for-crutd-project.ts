import type { PurchaseFormPDFResolver } from "./generate-purchase-form-pdf";
import { generateOrderForms, type GenerateOrderFormsInput } from "./generate-order-forms";

type GenerateOrderFormsForCRUTDProjectInput = Omit<GenerateOrderFormsInput, "justification" | "orgName"> & GenerateCRUTDJustificationInput

type GenerateCRUTDJustificationInput = {
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

export type CometProject = keyof typeof cometProjects;

export function generateCRUTDJustification(
	data: GenerateCRUTDJustificationInput,
) {
	let justification = `These parts are needed for the ${data.project} team to continue research and development on their project.`;
	if (data.justification) {
		if ("replace" in data.justification) {
			justification = data.justification.replace;
		} else {
			justification += `\n\n${data.justification.append}`;
		}
	}

	return justification;
}
export async function generateOrderFormsForCRUTDProject(
	data: GenerateOrderFormsForCRUTDProjectInput,
	purchaseFormPdfResolver: PurchaseFormPDFResolver,
) {
	const projectName = cometProjects[data.project];
	const justification = generateCRUTDJustification(data)


	return generateOrderForms({
		...data,
		justification,
		project: projectName,
		orgName: "Comet Robotics",
	}, purchaseFormPdfResolver);
}


