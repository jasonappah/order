export type OrderLineItem = {
    name: string
    vendor: string
    quantity: number
    url: string
    pricePerUnitCents: number
    shippingAndHandlingCents: number
    notes?: string
}

export type GeneratedPDF = {
    pdfBuffer: Uint8Array;
    vendor: string;
    projectName: string;
    requestDate: Date;
    filename: string;
    itemCount: number;
};

