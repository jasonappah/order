import ReactPDF from '@react-pdf/renderer';
import { OrderListPDF } from './order-list-pdf';
import type { OrderLineItem } from './types';
import { buffer } from 'node:stream/consumers';

type GenerateOrderListPDFInput = {
    projectName: string
    businessJustification: string
    requestDate: Date
    items: OrderLineItem[]
    vendor: string
}

export async function generateOrderListPDF(data: GenerateOrderListPDFInput) {
    return buffer(await ReactPDF.renderToStream(<OrderListPDF {...data} />));
}