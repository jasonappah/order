import { Command } from "@tauri-apps/plugin-shell";
import type { GenerateOrderFormsInput } from "../../../../packages/order-form/src/generate-order-forms";
import type {
  QualtricsFormInputs,
  QualtricsOrderPayload,
  QualtricsOrderResult,
} from "../../../../packages/qualtrics-order-form/src/types";

export async function submitQualtricsOrder(
  orderData: GenerateOrderFormsInput,
  formInputs: QualtricsFormInputs
): Promise<QualtricsOrderResult> {
  const payload: QualtricsOrderPayload = {
    orderData,
    formInputs,
  };

  const arg = JSON.stringify(payload);

  const cmd = Command.sidecar(
    "qualtrics-sidecar",
    [arg]
  );

  let stdout = "";
  let stderr = "";

  cmd.on("close", () => {
    // no-op
  });
  cmd.on("error", (error) => {
    stderr += String(error);
  });
  cmd.stdout.on("data", (line) => {
    stdout += line;
  });
  cmd.stderr.on("data", (line) => {
    stderr += line;
  });

  const child = await cmd.spawn();
  await child.wait();

  try {
    const parsed: QualtricsOrderResult = JSON.parse(stdout.trim());
    return parsed;
  } catch (e) {
    return {
      status: "error",
      message: "Failed to parse sidecar output",
      details: stderr || (e instanceof Error ? e.message : String(e)),
    };
  }
}

