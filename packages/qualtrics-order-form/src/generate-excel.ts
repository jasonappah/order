import * as XLSX from 'xlsx'
import type { OrderLineItem } from '../../order-form/src/types'
import { calculateOrderLineItemTotal, formatCentsAsDollarString } from '../../order-form/src/utilities'

export type ExcelRow = {
	Name: string
	Vendor: string
	Quantity: number
	URL: string
	PricePerUnit: string
	ShippingAndHandling: string
	TotalPrice: string
	Notes?: string
}

const mapItemsToRows = (items: OrderLineItem[]): ExcelRow[] => {
	return items.map((item) => ({
		Name: item.name,
		Vendor: item.vendor,
		Quantity: item.quantity,
		URL: item.url,
		PricePerUnit: formatCentsAsDollarString(item.pricePerUnitCents),
		ShippingAndHandling: formatCentsAsDollarString(item.shippingAndHandlingCents),
		TotalPrice: formatCentsAsDollarString(calculateOrderLineItemTotal(item)),
		Notes: item.notes,
	}))
}

export const generateRemainingItemsExcel = async (params: {
	items: OrderLineItem[]
	orgName: string
	projectName?: string
}): Promise<{
	name: string, 
	buffer: Buffer,
	mimeType: string
}> => {
	const { items, orgName, projectName } = params
	const rows = mapItemsToRows(items)
	const worksheet = XLSX.utils.json_to_sheet(rows)
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Remaining Items')

	const filenameBase = projectName ? `${orgName} ${projectName}` : orgName
	const filename = `${filenameBase} remaining items.xlsx`

	const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
	return {
		name: filename,
		buffer: wbout,
		mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	}
}
