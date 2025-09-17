import { Command } from "@tauri-apps/plugin-shell";
import type { GenerateOrderFormsInput } from "../../../../packages/order-form/src/generate-order-forms";
import type {
	QualtricsFormInputs,
	QualtricsOrderPayload,
	QualtricsOrderResult,
} from "../../../../packages/qualtrics-order-form/src/types";

export async function submitQualtricsOrder(
	orderData: GenerateOrderFormsInput,
	formInputs: QualtricsFormInputs,
): Promise<QualtricsOrderResult> {
	const payload: QualtricsOrderPayload = {
		orderData,
		formInputs,
	};

	const arg = ['--json', JSON.stringify(payload)];
	console.log(arg);

	const cmd = Command.sidecar("../../../packages/qualtrics-order-form/dist/qualtrics-sidecar", arg);
	const result = await cmd.execute();


	try {
		console.log("STDOUT:", result.stdout);
		console.log("STDERR:", result.stderr);

		const parsed: QualtricsOrderResult = JSON.parse(result.stdout);
		return parsed;
	} catch (e) {
		return {
			status: "error",
			message: "Failed to parse sidecar output",
			details: result.stderr.trim() || (e instanceof Error ? e.message : String(e)),
		};
	}
}

