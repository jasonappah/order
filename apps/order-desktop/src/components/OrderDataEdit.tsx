import { useState, useEffect, Fragment } from "react";
import {
  Text,
  Table,
  ScrollArea,
  TextInput,
  Button,
  Group,
  Loader,
  Alert,
  Badge,
  Paper,
} from "@mantine/core";
import { validateData, type ValidationResult } from "../lib/dataValidator";
import { REQUIRED_FIELDS } from "../lib/columnMapper";
import { transformToOrderLineItems } from "../lib/dataTransformer";
import { downloadAllPDFs, previewPDFGeneration } from "../lib/pdfGenerator";
import { generateCRUTDJustification } from "../../../../packages/order-form/src/generate-order-forms-for-crutd-project";
import { generateOrderForms } from "../../../../packages/order-form/src/generate-order-forms";
import type { GeneratedPDF } from "../../../../packages/order-form/src/types";
import { readFile } from "@tauri-apps/plugin-fs";
import { resolveResource } from "@tauri-apps/api/path";
import type { PurchaseFormPDFResolver } from "../../../../packages/order-form/src/generate-purchase-form-pdf";
import type { StateKeys, States } from "@/lib/tauri-store/appState";
import type { ParseResult } from "../lib/clipboardParser";

const purchaseFormPdfResolverOnTauriApp: PurchaseFormPDFResolver = async () => {
  const purchaseFormPdfBytes = await readFile(
    await resolveResource(
      "resources/Jonsson School Student Organization Purchase Form.pdf",
    ),
  );
  return purchaseFormPdfBytes;
};

interface OrderDataEditProps {
  parseResult: ParseResult;
  initialValidationResult: ValidationResult;
  user: States[typeof StateKeys.user];
  club: States[typeof StateKeys.club];
  onClear: () => void;
  className?: string;
}

export function OrderDataEdit({
  parseResult,
  initialValidationResult,
  user,
  club,
  onClear,
  className,
}: OrderDataEditProps) {
  const [editableData, setEditableData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult>(
    initialValidationResult,
  );
  const [isGeneratingPDFs, setIsGeneratingPDFs] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<GeneratedPDF[]>([]);
  const [pdfGenerationErrors, setPdfGenerationErrors] = useState<string[]>([]);

  // Initialize editable data when parseResult changes
  useEffect(() => {
    setEditableData(
      parseResult.rows.map((row, index) => ({ ...row, _id: index })),
    );
    setValidationResult(initialValidationResult);
  }, [parseResult, initialValidationResult]);

  const handleCellEdit = (rowId: number, fieldName: string, value: string) => {
    const updatedData = editableData.map((row) =>
      row._id === rowId ? { ...row, [fieldName]: value } : row,
    );
    setEditableData(updatedData);

    // Re-validate after edit
    const validation = validateData(updatedData);
    setValidationResult(validation);
  };

  const handleGeneratePDFs = async () => {
    if (!validationResult?.isValid || editableData.length === 0) {
      return;
    }

    setIsGeneratingPDFs(true);
    setPdfGenerationErrors([]);
    setGeneratedPDFs([]);

    try {
      const orderItems = transformToOrderLineItems(editableData);

      const result = await generateOrderForms(
        {
          items: orderItems,
          contactName: user.name,
          contactEmail: user.email,
          contactPhone: user.phone,
          orgName:
            club.type === "comet-robotics" ? "Comet Robotics" : club.name,
          justification:
            club.type === "comet-robotics"
              ? generateCRUTDJustification({
                  // TODO: render project selector component when club is comet robotics. Render text input for justification always
                  project: "ChessBots",
                })
              : "Hi lol",
        },
        purchaseFormPdfResolverOnTauriApp,
      );

      setGeneratedPDFs(result);
      await downloadAllPDFs(result);
    } catch (error) {
      console.error("PDF generation error:", error);
      setPdfGenerationErrors([
        error instanceof Error
          ? error.message
          : "Unknown error during PDF generation",
      ]);
    } finally {
      setIsGeneratingPDFs(false);
    }
  };

  // Calculate preview information
  const pdfPreview =
    editableData.length > 0
      ? (() => {
          try {
            const orderItems = transformToOrderLineItems(editableData);
            return previewPDFGeneration(orderItems);
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <div className={className}>
      <Fragment>
        <Text size="md" fw={600} mb="md">
          Order Data Table
        </Text>
        <Button onClick={onClear} mb="md">
          Clear paste
        </Button>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {parseResult.headers.map((header, index) => (
                  <Table.Th key={index} style={{ minWidth: "120px" }}>
                    {header}
                    {REQUIRED_FIELDS[index]?.required && (
                      <Text component="span" c="red" size="xs">
                        {" "}
                        *
                      </Text>
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {editableData.map((row, rowIndex) => (
                <Table.Tr key={row._id}>
                  {parseResult.headers.map((header, colIndex) => {
                    const field = REQUIRED_FIELDS[colIndex];
                    const value = row[header] || "";
                    const hasError = validationResult?.errors.some(
                      (error) =>
                        error.row === rowIndex + 1 &&
                        error.field === field?.label,
                    );

                    return (
                      <Table.Td key={`${row._id}-${colIndex}`}>
                        <TextInput
                          value={value}
                          onChange={(e) =>
                            handleCellEdit(row._id, header, e.target.value)
                          }
                          size="xs"
                          error={hasError}
                          styles={{
                            input: {
                              fontSize: "12px",
                              backgroundColor: hasError ? "#ffe6e6" : undefined,
                              border: hasError
                                ? "1px solid #fa5252"
                                : undefined,
                            },
                          }}
                          placeholder={
                            field?.required ? "Required" : "Optional"
                          }
                        />
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {validationResult && !validationResult.isValid && (
          <Paper p="sm" mt="md" bg="red.0" withBorder>
            <Text size="sm" fw={600} c="red" mb="xs">
              Validation Errors:
            </Text>
            {validationResult.errors.slice(0, 5).map((error) => (
              <Text key={error.id} size="xs" c="red">
                • Row {error.row}: {error.error}
              </Text>
            ))}
            {validationResult.errors.length > 5 && (
              <Text size="xs" c="dimmed">
                ... and {validationResult.errors.length - 5} more errors
              </Text>
            )}
          </Paper>
        )}

        {pdfPreview && (
          <Paper p="sm" mt="md" bg="blue.0" withBorder>
            <Text size="sm" fw={600} mb="xs">
              PDF Generation Preview:
            </Text>
            <Group gap="md">
              <Badge variant="light" color="blue">
                {pdfPreview.vendorCount} vendor
                {pdfPreview.vendorCount !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="light" color="green">
                {pdfPreview.totalItems} item
                {pdfPreview.totalItems !== 1 ? "s" : ""}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Vendors: {pdfPreview.vendors.join(", ")}
            </Text>
          </Paper>
        )}

        <Group mt="md">
          <Button
            disabled={!validationResult?.isValid || isGeneratingPDFs}
            size="sm"
            onClick={handleGeneratePDFs}
            leftSection={isGeneratingPDFs ? <Loader size="xs" /> : undefined}
          >
            {isGeneratingPDFs
              ? "Generating PDFs..."
              : "Generate & Download PDFs"}
          </Button>
        </Group>

        {generatedPDFs.length > 0 && (
          <Alert variant="light" color="green" mt="md">
            <Text size="sm" fw={600}>
              ✅ Successfully generated {generatedPDFs.length} PDF
              {generatedPDFs.length !== 1 ? "s" : ""}
            </Text>
            {generatedPDFs.map((pdf, index) => (
              <Text key={index} size="xs">
                • {pdf.vendor}: {pdf.itemCount} item
                {pdf.itemCount !== 1 ? "s" : ""} ({pdf.filename})
              </Text>
            ))}
          </Alert>
        )}

        {pdfGenerationErrors.length > 0 && (
          <Alert variant="light" color="red" mt="md">
            <Text size="sm" fw={600}>
              ❌ PDF Generation Errors:
            </Text>
            {pdfGenerationErrors.map((error, index) => (
              <Text key={index} size="xs">
                • {error}
              </Text>
            ))}
          </Alert>
        )}
      </Fragment>
    </div>
  );
}
