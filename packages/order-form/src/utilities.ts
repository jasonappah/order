import type { OrderLineItem } from "./types";

export const formatDate = (date: Date) =>
	new Date(date).toLocaleDateString("en-US");
export const formatCentsAsDollarString = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const calculateTotalCents = (items: OrderLineItem[]) =>
	items.reduce((sum, item) => {
		return sum + calculateOrderLineItemTotal(item);
	}, 0);

export const groupItemsByVendor = (items: OrderLineItem[]) =>
	items.reduce(
		(groupedItems, item) => {
			if (!groupedItems[item.vendor]) {
				groupedItems[item.vendor] = [];
			}
			groupedItems[item.vendor]?.push(item);
			return groupedItems;
		},
		{} as Record<string, OrderLineItem[]>,
	);

export const calculateOrderLineItemTotal = (item: OrderLineItem): number =>
	item.pricePerUnitCents * item.quantity + (item.shippingAndHandlingCents || 0);

export const generatePdfName = (
	projectName: string,
	vendor: string,
	requestDate: Date,
	orgName?: string,
) => `${orgName ? `${orgName} ` : ""}${projectName} order at ${vendor} ${formatDate(requestDate).replace(/\//g, "-")}.pdf`;
