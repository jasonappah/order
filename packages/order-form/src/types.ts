export type OrderLineItem = {
    name: string
    vendor: string
    quantity: number
    url: string
    pricePerUnitCents: number
    shippingAndHandlingCents: number
    notes?: string
}

