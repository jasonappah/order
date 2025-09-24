import { parseArgs } from "node:util";
import { completeForm, launchBrowser } from "./complete-form";
import type { QualtricsOrderPayload, QualtricsOrderResult } from "./types";
import { buildVars } from "./build-vars-macro" with { type: "macro" };

function yieldResult(result: QualtricsOrderResult, waitForInputBeforeExit: boolean): never {
	console.error("Yielding result", result);
	console.log(JSON.stringify(result));
	if (waitForInputBeforeExit) {
		prompt("Press Enter to continue");
	}
	return process.exit(result.status === "success" ? 0 : 1);
}

export const main = async (argv: string[], hang = false) => {
    const vars = buildVars();
	console.error("Starting sidecar. Built at", vars.buildTime);

	const args = parseArgs({
		args: argv,
		strict: true,
		allowPositionals: true,
		options: {
			json: {
				type: "string",
			},
		},
	});
	console.error("Parsed args", args);
	const { values } = args;

	const arg = values.json;
	if (!arg) {
		yieldResult({ status: "error", message: `Didn't provide a JSON payload` }, hang);
	}

	let payload: QualtricsOrderPayload;
	try {
		payload = JSON.parse(arg);
	} catch (e) {
		yieldResult({
			status: "error",
			message: "Invalid JSON input",
			details: e instanceof Error ? e.message : String(e),
		}, hang);
	}

	const { page } = await launchBrowser();
	try {
		await completeForm({ page, payload });
		yieldResult({
			status: "success",
		}, hang);
	} catch (e) {
		yieldResult({
			status: "error",
			message: "Failed to complete Qualtrics form",
			details: e instanceof Error ? e.message : String(e),
		}, hang);
	}
};

