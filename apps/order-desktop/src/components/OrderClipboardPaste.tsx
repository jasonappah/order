import { Paper } from "@mantine/core";
import { useState, type ReactNode } from "react";
import { OrderPasteInput } from "./OrderPasteInput";
import { OrderDataEdit } from "./OrderDataEdit";
import type { ParseResult } from "../lib/clipboardParser";
import type { ValidationResult } from "../lib/dataValidator";
import type { StateKeys, States } from "@/lib/tauri-store/appState";

interface OrderClipboardPasteProps {
  className?: string;
  user: States[typeof StateKeys.user];
  club: States[typeof StateKeys.club];
}

export function OrderClipboardPaste({
  className,
  user,
  club,
}: OrderClipboardPasteProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const handleDataProcessed = (
    newParseResult: ParseResult | null,
    newValidationResult: ValidationResult | null,
  ) => {
    setParseResult(newParseResult);
    setValidationResult(newValidationResult);
  };

  const handleClearPaste = () => {
    setParseResult(null);
    setValidationResult(null);
  };

  let inner: ReactNode;

  if (parseResult && validationResult) {
    inner = (
      <OrderDataEdit
        parseResult={parseResult}
        initialValidationResult={validationResult}
        user={user}
        club={club}
        onClear={handleClearPaste}
      />
    );
  } else {
    inner = <OrderPasteInput onDataProcessed={handleDataProcessed} />;
  }

  return (
    <Paper
      className={className}
      shadow="sm"
      radius="md"
      role="region"
      aria-labelledby="order-paste-heading"
    >
      {inner}
    </Paper>
  );
}
