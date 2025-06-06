## Relevant Files

- `apps/order-desktop/src/routes/index.tsx`  
  Main route file; likely entry point for the new clipboard-to-PDF UI.
- `apps/order-desktop/src/components/OrderClipboardPaste.tsx`  
  New component for the paste area, table display, and editing.
- `apps/order-desktop/src/lib/clipboardParser.ts`  
  Utility for parsing and validating clipboard/tabular data.
- `packages/order-form/src/generate-order-forms-for-crutd-project.ts`  
  Existing logic for generating PDFs per vendor.
- `packages/order-form/src/generate-order-list-pdf.tsx`  
  Existing PDF generation logic.
- `packages/order-form/src/types.ts`  
  Type definitions for order line items.
- `packages/order-form/src/test.ts`  
  Example of running existing PDF generation logic.

---

## Tasks

- [x] 1.0 Design and implement the clipboard paste UI for order data input
  - [x] 1.1 Create a new `OrderClipboardPaste` component with a clear area for pasting tabular data.
  - [x] 1.2 Add user instructions and visual cues for pasting data (e.g., "Paste your order rows here").
  - [x] 1.3 Integrate the component into the main route (`index.tsx`) or a new route if needed.
  - [x] 1.4 Ensure accessibility and keyboard navigation for the paste area.

- [x] 2.0 Parse and validate pasted tabular data against required columns
  - [x] 2.1 Implement a utility (`clipboardParser.ts`) to parse tab-separated values from the clipboard.
  - [x] 2.2 Map parsed columns to required fields: Priority, Classification, Name, Vendor, Part #, Link, Price per Unit, Quantity, Tax, S&H, TOTAL, Delivery Type, Notes.
  - [x] 2.3 Validate that all required columns are present and each row contains valid data types.
  - [x] 2.4 Display user-friendly error messages for missing/invalid data.

- [x] 3.0 Display and enable inline editing of the parsed order data
  - [x] 3.1 Render the parsed data in an editable table within `OrderClipboardPaste`.
  - [x] 3.2 Allow inline editing of any cell, with validation on change.
  - [x] 3.3 Highlight cells or rows with errors.
  - [x] 3.4 Disable the "Generate PDF" button until all data is valid.

- [ ] 4.0 Integrate PDF generation per vendor using existing logic
  - [ ] 4.1 Transform validated table data into the format expected by the PDF generation logic (`OrderLineItem[]`).
  - [ ] 4.2 Call the existing PDF generation functions from `@/order-form` for each vendor.
  - [ ] 4.3 Handle asynchronous PDF generation and loading states.
  - [ ] 4.4 Ensure the generated PDFs use the correct layout and data.

- [ ] 5.0 Implement error handling, user feedback, and download functionality
  - [ ] 5.1 Provide clear feedback for parsing, validation, and PDF generation errors.
  - [ ] 5.2 Allow users to download or save each generated PDF (one per vendor).
  - [ ] 5.3 Add success and error notifications for user actions.
