import { useState, useEffect } from "react";
import { Textarea, Text, Stack } from "@mantine/core";
import { parseClipboardData, type ParseResult } from "../lib/clipboardParser";
import {
  validateData,
  type ValidationResult,
  getValidationSummary,
} from "../lib/dataValidator";

interface OrderPasteInputProps {
  onDataProcessed: (
    parseResult: ParseResult | null,
    validationResult: ValidationResult | null,
  ) => void;
  className?: string;
}

export function OrderPasteInput({
  onDataProcessed,
  className,
}: OrderPasteInputProps) {
  const [pastedData, setPastedData] = useState<string>("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  useEffect(() => {
    processData(pastedData);
  }, [pastedData]);

  const processData = (data: string) => {
    if (!data.trim()) {
      onDataProcessed(null, null);
      return;
    }

    // Parse the data
    const parsed = parseClipboardData(data);

    // Validate the data
    const validation = validateData(parsed.rows);

    setValidationResult(validation);
    onDataProcessed(parsed, validation);
  };

  const handleChange = (value: string) => {
    setPastedData(value);
  };

  return (
    <Stack gap="md" className={className}>
      <div>
        <Text size="lg" fw={600} mb="xs" id="order-paste-heading">
          Paste Order Data
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Paste your tabular order data here (data rows only, no headers).
          Columns should be in this exact order: Name, Vendor, Part #, Link,
          Price per Unit, Quantity, Tax, S&amp;H, TOTAL, Delivery Type, Notes.
        </Text>
      </div>

      <Textarea
        placeholder="Paste your tab-separated order data here..."
        value={pastedData}
        onChange={(event) => handleChange(event.currentTarget.value)}
        minRows={8}
        autosize
        className="font-mono text-sm"
        label="Order Data Input"
        description="Press Ctrl+V (or Cmd+V on Mac) to paste your data"
        aria-label="Paste area for tabular order data including Priority, Classification, Name, Vendor, Part Number, Link, Price per Unit, Quantity, Tax, Shipping and Handling, Total, Delivery Type, and Notes"
        styles={{
          input: {
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f8f9fa",
          },
        }}
      />

      {validationResult && (
        <Text size="sm" c={validationResult.isValid ? "green" : "red"}>
          {getValidationSummary(validationResult)}
        </Text>
      )}
    </Stack>
  );
}
