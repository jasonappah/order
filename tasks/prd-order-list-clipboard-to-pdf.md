# Product Requirements Document: Order List Clipboard-to-PDF Feature

## 1. Introduction/Overview
This feature enables users to quickly generate order form PDFs by copying selected rows from a standardized order spreadsheet and pasting them directly into the desktop app. The user can review and edit the pasted data before generating PDFs, streamlining the procurement process and reducing manual data entry errors. The system will generate one PDF per vendor, using the existing PDF logic and layout.

## 2. Goals
- Allow users to paste order data from the clipboard (copied from a spreadsheet) into the desktop app.
- Enable users to review and edit the pasted data before generating PDFs.
- Generate a separate PDF order form for each vendor represented in the pasted data.
- Ensure all required columns are present and valid; display errors if not.
- Use the existing PDF layout and logic from the `@/order-form` package.

## 3. User Stories
- **As a procurement manager, I want to copy selected rows from my order spreadsheet and paste them into the app, so I can quickly generate order forms for only the items I need to purchase.**
- **As a user, I want to review and edit the pasted data before generating PDFs, so I can correct any mistakes or omissions.**
- **As a user, I want the app to alert me if any required columns are missing or contain invalid data, so I can fix issues before generating the order forms.**
- **As a user, I want the app to generate a separate PDF for each vendor, so I can easily send the correct order form to each supplier.**

## 4. Functional Requirements
1. The system must provide a UI area where users can paste tabular data copied from a spreadsheet (Cmd+V).
2. The system must parse the pasted data and map it to the required columns: Priority, Classification, Name, Vendor, Part #, Link, Price per Unit, Quantity, Tax, S&H, TOTAL, Delivery Type, Notes.
3. The system must display the parsed data in a table, allowing users to review and edit any cell before proceeding.
4. The system must validate that all required columns are present and that each row contains valid data; if not, an error message must be shown indicating the issue.
5. The system must allow users to proceed to PDF generation only if all data is valid.
6. The system must generate one PDF per vendor, using the existing PDF generation logic and layout from the `@/order-form` package.
7. The system must provide a way for users to download or save the generated PDFs.
8. The system must handle small to moderate numbers of items per paste (e.g., up to 20 rows).

## 5. Non-Goals (Out of Scope)
- No support for file uploads (CSV/XLSX) or drag-and-drop import.
- No support for pasting data with missing or extra columns (all required columns must be present).
- No support for very large order lists (over 20 items per paste).
- No changes to the existing PDF layout or content.

## 6. Design Considerations (Optional)
- The UI should be clean, modern, and easy to use, with clear instructions for pasting data.
- The review/edit table should support inline editing and highlight errors clearly.
- The PDF generation button should be prominent and disabled until all data is valid.
- Consider using existing UI components/styles from the desktop app for consistency.

## 7. Technical Considerations (Optional)
- Integrate with the existing PDF generation logic in the `@/order-form` package.
- Ensure robust parsing of clipboard data, handling common spreadsheet formats (e.g., tab-separated values).
- Validate data types (e.g., numeric fields for price/quantity) and required fields.
- Error handling should be user-friendly and actionable.

## 8. Success Metrics
- The feature is considered successful if users can reliably paste, review, and generate vendor-specific PDFs from their order spreadsheet with minimal errors and no manual reformatting.

## 9. Open Questions
- Should the app support undo/redo for edits made in the review table?
- Should there be a way to save/load draft order lists for later editing?
- Are there any accessibility requirements for the review/edit UI? 