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
  Select,
  Textarea,
} from "@mantine/core";
import { validateData, type ValidationResult } from "../lib/dataValidator";
import { REQUIRED_FIELDS } from "../lib/columnMapper";
import { transformToOrderLineItems } from "../lib/dataTransformer";
import { downloadAllPDFs, previewPDFGeneration } from "../lib/pdfGenerator";
import {
  generateCRUTDJustification,
  type CometProject,
} from "../../../../packages/order-form/src/generate-order-forms-for-crutd-project";
import { generateOrderForms } from "../../../../packages/order-form/src/generate-order-forms";
import type { GeneratedPDF } from "../../../../packages/order-form/src/types";
import { readFile } from "@tauri-apps/plugin-fs";
import { resolveResource } from "@tauri-apps/api/path";
import type { PurchaseFormPDFResolver } from "../../../../packages/order-form/src/generate-purchase-form-pdf";
import type { StateKeys, States } from "@/lib/tauri-store/appState";
import type { ParseResult } from "../lib/clipboardParser";
import { submitQualtricsOrder } from "../lib/qualtrics";
import type { QualtricsFormInputs } from "../../../../packages/qualtrics-order-form/src/types";

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
  const [selectedProject, setSelectedProject] =
    useState<CometProject>("General");
  const [justificationText, setJustificationText] = useState<string>("");
  const [isSubmittingQualtrics, setIsSubmittingQualtrics] = useState(false);
  const [qualtricsResult, setQualtricsResult] = useState<null | { status: string; message?: string }>(null);
  const [qualtricsError, setQualtricsError] = useState<string | null>(null);

  const [qualtricsInputs, setQualtricsInputs] = useState<QualtricsFormInputs>({
    netID: user.email.split("@")[0] || "",
    advisor: { name: "", email: "" },
    eventName: "",
    eventDate: "",
    costCenter: { type: "Student Organization Cost Center" },
  });

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
                  project: selectedProject,
                  justification: {
                    append: justificationText
                  }
                  
                })
              : justificationText || undefined,
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

  const handleSubmitQualtrics = async () => {
    console.log("Validation result:", validationResult);
    console.log("Editable data:", editableData);
    if (!validationResult?.isValid || editableData.length === 0) {
      console.error("Validation result is invalid or editable data is empty");
      return;
    }
    setIsSubmittingQualtrics(true);
    setQualtricsResult(null);
    setQualtricsError(null);
    try {
      const orderItems = transformToOrderLineItems(editableData);
      const result = await submitQualtricsOrder(
        {
          items: orderItems,
          contactName: user.name,
          contactEmail: user.email,
          contactPhone: user.phone,
          orgName: club.type === "comet-robotics" ? "Comet Robotics" : club.name,
          justification:
            club.type === "comet-robotics"
              ? generateCRUTDJustification({
                  project: selectedProject,
                  justification: { append: justificationText },
                })
              : justificationText || undefined,
        },
        qualtricsInputs
      );
      setQualtricsResult(result);
      if (result.status === "error") {
        setQualtricsError(result.message ?? "Unknown error");
      }
    } catch (e) {
      setQualtricsError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmittingQualtrics(false);
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

        {club.type === "comet-robotics" && (
          <Select
            label="Project"
            description="Select the Comet Robotics project this order is for"
            value={selectedProject}
            onChange={(value) => setSelectedProject(value as CometProject)}
            data={[
              { value: "General", label: "General" },
              { value: "Marketing", label: "Marketing" },
              {
                value: "Full Combat",
                label: "Full Combat Robots (Ants, Beetles, etc.)",
              },
              { value: "Plant", label: "Plant Combat Robots" },
              { value: "Sumo", label: "SumoBots" },
              { value: "VexU", label: "VEX U" },
              { value: "ChessBots", label: "ChessBots" },
              { value: "SRP", label: "Solis Rover Project" },
            ]}
            mb="md"
            required
          />
        )}

        
        <Textarea
          label="Justification"
          description="Provide a justification for this order"
          placeholder="Explain why these items are needed..."
          value={justificationText}
          onChange={(event) =>
            setJustificationText(event.currentTarget.value)
          }
          mb="md"
          minRows={3}
        />

        <Paper p="sm" mt="md" withBorder>
          <Text size="sm" fw={600} mb="xs">Qualtrics Submission Details</Text>
          <Group grow>
            <TextInput
              label="Student NetID"
              placeholder="abc123456"
              value={qualtricsInputs.netID}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, netID: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Advisor Name"
              placeholder="Dr. Example"
              value={qualtricsInputs.advisor.name}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, advisor: { ...qualtricsInputs.advisor, name: e.currentTarget.value } })}
              required
            />
            <TextInput
              label="Advisor Email (UTD)"
              placeholder="advisor@utdallas.edu"
              value={qualtricsInputs.advisor.email}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, advisor: { ...qualtricsInputs.advisor, email: e.currentTarget.value } })}
              required
            />
          </Group>
          <Group grow mt="sm">
            <TextInput
              label="Event Name"
              value={qualtricsInputs.eventName}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, eventName: e.currentTarget.value })}
            />
            <TextInput
              label="Event Date (MM/DD/YYYY)"
              placeholder="MM/DD/YYYY"
              value={qualtricsInputs.eventDate}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, eventDate: e.currentTarget.value })}
            />
            <Select
              label="Cost Center Type"
              value={qualtricsInputs.costCenter.type}
              onChange={(value) => {
                if (!value) return;
                if (value === 'Other') {
                  setQualtricsInputs({ ...qualtricsInputs, costCenter: { type: 'Other', value: '' } });
                } else {
                  setQualtricsInputs({ ...qualtricsInputs, costCenter: { type: value as any } });
                }
              }}
              data={[
                { value: 'Student Organization Cost Center', label: 'Student Organization Cost Center' },
                { value: 'Jonsson School Student Council funding', label: 'Jonsson School Student Council funding' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </Group>
          {qualtricsInputs.costCenter.type === 'Other' && (
            <TextInput
              mt="sm"
              label="Cost Center (Other)"
              placeholder="Enter cost center"
              value={qualtricsInputs.costCenter.value || ''}
              onChange={(e) => setQualtricsInputs({ ...qualtricsInputs, costCenter: { type: 'Other', value: e.currentTarget.value } })}
              required
            />
          )}
        </Paper>
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
        
        {validationResult && validationResult.warnings.length > 0 && (
          <Paper p="sm" mt="md" bg="yellow.0" withBorder>
            <Text size="sm" fw={600} c="orange" mb="xs">
              Validation Warnings:
            </Text>
            {validationResult.warnings.slice(0, 5).map((warning) => (
              <Text key={warning.id} size="xs" c="orange">
                • Row {warning.row}: {warning.error}
              </Text>
            ))}
            {validationResult.warnings.length > 5 && (
              <Text size="xs" c="dimmed">
                ... and {validationResult.warnings.length - 5} more warnings
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
          <Button
            variant="outline"
            disabled={!validationResult?.isValid || isSubmittingQualtrics}
            size="sm"
            onClick={handleSubmitQualtrics}
            leftSection={isSubmittingQualtrics ? <Loader size="xs" /> : undefined}
          >
            {isSubmittingQualtrics ? "Submitting to Qualtrics..." : "Submit to Qualtrics"}
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

        {qualtricsResult && (
          <Alert variant="light" color={qualtricsResult.status === "success" ? "green" : "red"} mt="md">
            <Text size="sm" fw={600}>
              {qualtricsResult.status === "success"
                ? "✅ Qualtrics submission prepared successfully"
                : "❌ Qualtrics submission failed"}
            </Text>
            {qualtricsError && (
              <Text size="xs">• {qualtricsError}</Text>
            )}
          </Alert>
        )}
      </Fragment>
    </div>
  );
}
