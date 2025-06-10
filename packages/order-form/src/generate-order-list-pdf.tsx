import {pdf} from '@react-pdf/renderer';
import { OrderListPDF } from './order-list-pdf';
import type { OrderLineItem } from './types';

type GenerateOrderListPDFInput = {
    requestDate: Date
    items: OrderLineItem[]
    vendor: string
}

export async function generateOrderListPDF(data: GenerateOrderListPDFInput) {
    const component = <OrderListPDF {...data} />;
    return await (await pdf(component).toBlob()).bytes()
}