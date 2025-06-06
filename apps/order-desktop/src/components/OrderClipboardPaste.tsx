import { useState, useRef } from 'react';
import { Textarea, Text, Paper, Stack, Table, ScrollArea, TextInput, Button } from '@mantine/core';
import { parseClipboardData, type ParseResult } from '../lib/clipboardParser';
import { validateData, type ValidationResult, getValidationSummary } from '../lib/dataValidator';
import { REQUIRED_FIELDS } from '../lib/columnMapper';

interface OrderClipboardPasteProps {
  onDataPaste?: (data: string) => void;
  onValidDataReady?: (data: any[]) => void;
  className?: string;
}

export function OrderClipboardPaste({ onDataPaste, onValidDataReady, className }: OrderClipboardPasteProps) {
  const [pastedData, setPastedData] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [editableData, setEditableData] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData('text');
    processData(clipboardData);
  };

  const handleChange = (value: string) => {
    processData(value);
  };

  const processData = (data: string) => {
    setPastedData(data);
    
    if (onDataPaste) {
      onDataPaste(data);
    }

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

    // Notify parent if data is valid
    if (validation.isValid && onValidDataReady) {
      onValidDataReady(updatedData);
    }
  };

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
          onPaste={handlePaste}
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
          onKeyDown={(event) => {
            // Handle keyboard shortcuts for accessibility
            if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
              // Allow Ctrl+A / Cmd+A to select all
              event.currentTarget.select();
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
                {validationResult.errors.slice(0, 5).map((error, index) => (
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

            <Button 
              mt="md" 
              disabled={!validationResult?.isValid}
              size="sm"
            >
              Generate PDF
            </Button>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
} 