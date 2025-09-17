import { parseArgs } from "node:util";
import { completeForm } from "./main";
import { QualtricsOrderPayload, QualtricsOrderResult } from "./types";

function yieldResult(result: QualtricsOrderResult): never {
	console.error("Yielding result", result);
	console.log(JSON.stringify(result));
	return process.exit(result.status === "success" ? 0 : 1);
}

const main = async () => {
	console.error("Starting sidecar");

	const args = parseArgs({
		args: Bun.argv,
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
		yieldResult({ status: "error", message: `Didn't provide a JSON payload` });
	}

	let payload: QualtricsOrderPayload;
	try {
		payload = JSON.parse(arg);
	} catch (e) {
		yieldResult({
			status: "error",
			message: "Invalid JSON input",
			details: e instanceof Error ? e.message : String(e),
		});
	}

	const { page } = await launchBrowser();
	try {
		await completeForm({ page, payload });
		yieldResult({
			status: "success",
		});
	} catch (e) {
		yieldResult({
			status: "error",
			message: "Failed to complete Qualtrics form",
			details: e instanceof Error ? e.message : String(e),
		});
	}
};

void main();
