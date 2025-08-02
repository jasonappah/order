import { useState, useRef } from 'react';
import { Textarea, Text, Paper, Stack, Table, ScrollArea, TextInput, Button, Group, Loader, Alert, Badge } from '@mantine/core';
import { parseClipboardData, type ParseResult } from '../lib/clipboardParser';
import { validateData, type ValidationResult, getValidationSummary } from '../lib/dataValidator';
import { REQUIRED_FIELDS } from '../lib/columnMapper';
import { transformToOrderLineItems } from '../lib/dataTransformer';
import { downloadAllPDFs, previewPDFGeneration } from '../lib/pdfGenerator';
import { generateCRUTDJustification, generateOrderForms } from '../../../../packages/order-form/src/generate-order-forms-for-crutd-project';
import type { GeneratedPDF } from '../../../../packages/order-form/src/types';
import { readFile } from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';
import type { PurchaseFormPDFResolver } from '../../../../packages/order-form/src/generate-purchase-form-pdf';
import { StateKeys, useAppState } from '@/lib/tauri-store/appState';

const purchaseFormPdfResolverOnTauriApp: PurchaseFormPDFResolver = async () => {
    const purchaseFormPdfBytes = await readFile(await resolveResource('resources/Jonsson School Student Organization Purchase Form.pdf'))
    return purchaseFormPdfBytes
  }


interface OrderClipboardPasteProps {
  className?: string;
}

export function OrderClipboardPaste({ className }: OrderClipboardPasteProps) {
  const [pastedData, setPastedData] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [editableData, setEditableData] = useState<any[]>([]);
  const [isGeneratingPDFs, setIsGeneratingPDFs] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<GeneratedPDF[]>([]);
  const [pdfGenerationErrors, setPdfGenerationErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = useAppState(StateKeys.user)
  const club = useAppState(StateKeys.club)
  
  if (!user) {
    // TODO: redirect to user setup page
    return <p>where user lol</p>
  }
  
  if (!club) {
    // TODO: redirect to club setup page
    return <p>where club lol</p>
  }
  
  const handleChange = (value: string) => {
    processData(value);
  };

  const processData = (data: string) => {
    setPastedData(data);

    if (!data.trim()) {
      setParseResult(null);
      setValidationResult(null);
      setEditableData([]);
      return;
    }

    // Parse the data
    const parsed = parseClipboardData(data);
    setParseResult(parsed);

    // Validate the data
    const validation = validateData(parsed.rows);
    setValidationResult(validation);

    // Set up editable data
    setEditableData(parsed.rows.map((row, index) => ({ ...row, _id: index })));
  };

  const handleCellEdit = (rowId: number, fieldName: string, value: string) => {
    const updatedData = editableData.map(row => 
      row._id === rowId ? { ...row, [fieldName]: value } : row
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
      
      // Generate PDFs
      const result = await generateOrderForms({
        items: orderItems,
        contactName: user.name,
        contactEmail: user.email,
        contactPhone: user.phone,
        orgName: club.type === 'comet-robotics' ? 'Comet Robotics' : club.name,
        justification: club.type === 'comet-robotics' ? generateCRUTDJustification({
          // TODO: render project selector component when club is comet robotics. Render text input for justification always
          project: 'ChessBots'
        }) : 'Hi lol'
      }, purchaseFormPdfResolverOnTauriApp);

    setGeneratedPDFs(result);
    await downloadAllPDFs(result);

    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfGenerationErrors([
        error instanceof Error ? error.message : 'Unknown error during PDF generation'
      ]);
    } finally {
      setIsGeneratingPDFs(false);
    }
  };

  // Calculate preview information
  const pdfPreview = editableData.length > 0 ? (() => {
    try {
      const orderItems = transformToOrderLineItems(editableData);
      return previewPDFGeneration(orderItems);
    } catch {
      return null;
    }
  })() : null;

  return (
    <Paper 
      className={`p-6 ${className}`} 
      shadow="sm" 
      radius="md"
      role="region"
      aria-labelledby="order-paste-heading"
    >
      <Stack gap="md">
        <div>
          <Text size="lg" fw={600} mb="xs" id="order-paste-heading">
            Paste Order Data
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Paste your tabular order data here (data rows only, no headers). 
            Columns should be in this exact order: Name, Vendor, Part #, Link, Price per Unit, Quantity, Tax, S&H, TOTAL, Delivery Type, Notes.
          </Text>
        </div>
        
        <Textarea
          ref={textareaRef}
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
              fontSize: '13px',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
            }
          }}
        />
        
        {pastedData && (
          <Text size="xs" c="dimmed">
            {pastedData.split('\n').filter(line => line.trim()).length} rows detected
          </Text>
        )}

        {validationResult && (
          <Text size="sm" c={validationResult.isValid ? 'green' : 'red'}>
            {getValidationSummary(validationResult)}
          </Text>
        )}

        {parseResult && editableData.length > 0 && (
          <Paper p="md" withBorder>
            <Text size="md" fw={600} mb="md">
              Order Data Table
            </Text>
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {parseResult.headers.map((header, index) => (
                      <Table.Th key={index} style={{ minWidth: '120px' }}>
                        {header}
                        {REQUIRED_FIELDS[index]?.required && (
                          <Text component="span" c="red" size="xs"> *</Text>
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
                        const value = row[header] || '';
                        const hasError = validationResult?.errors.some(
                          error => error.row === rowIndex + 1 && error.field === field?.label
                        );
                        
                        return (
                          <Table.Td key={`${row._id}-${colIndex}`}>
                            <TextInput
                              value={value}
                              onChange={(e) => handleCellEdit(row._id, header, e.target.value)}
                              size="xs"
                              error={hasError}
                              styles={{
                                input: {
                                  fontSize: '12px',
                                  backgroundColor: hasError ? '#ffe6e6' : undefined,
                                  border: hasError ? '1px solid #fa5252' : undefined
                                }
                              }}
                              placeholder={field?.required ? 'Required' : 'Optional'}
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
                <Text size="sm" fw={600} c="red" mb="xs">Validation Errors:</Text>
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
                <Text size="sm" fw={600} mb="xs">PDF Generation Preview:</Text>
                <Group gap="md">
                  <Badge variant="light" color="blue">
                    {pdfPreview.vendorCount} vendor{pdfPreview.vendorCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="light" color="green">
                    {pdfPreview.totalItems} item{pdfPreview.totalItems !== 1 ? 's' : ''}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                  Vendors: {pdfPreview.vendors.join(', ')}
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
                {isGeneratingPDFs ? 'Generating PDFs...' : 'Generate & Download PDFs'}
              </Button>
            </Group>

            {generatedPDFs.length > 0 && (
              <Alert variant="light" color="green" mt="md">
                <Text size="sm" fw={600}>✅ Successfully generated {generatedPDFs.length} PDF{generatedPDFs.length !== 1 ? 's' : ''}</Text>
                {generatedPDFs.map((pdf, index) => (
                  <Text key={index} size="xs">
                    • {pdf.vendor}: {pdf.itemCount} item{pdf.itemCount !== 1 ? 's' : ''} ({pdf.filename})
                  </Text>
                ))}
              </Alert>
            )}

            {pdfGenerationErrors.length > 0 && (
              <Alert variant="light" color="red" mt="md">
                <Text size="sm" fw={600}>❌ PDF Generation Errors:</Text>
                {pdfGenerationErrors.map((error, index) => (
                  <Text key={index} size="xs">
                    • {error}
                  </Text>
                ))}
              </Alert>
            )}
          </Paper>
        )}
      </Stack>
    </Paper>
  );
} 