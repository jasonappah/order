import { chromium, type Page } from "playwright";
import {
	resolveFinalConfig,
	type GenerateOrderFormsInput,
} from "../../order-form/src/generate-order-forms";
import {
	calculateOrderLineItemTotal,
	formatCentsAsDollarString,
	groupItemsByVendor,
} from "../../order-form/src/utilities";
import { generateRemainingItemsExcel } from "./generate-excel";
import type { QualtricsOrderPayload } from "./types";
import { QUALTRICS_ORDER_FORM_URL, ORDER_ITEM_LIMIT } from "./constants";

const clickNext = async (page: Page) => {
	await page.getByRole("button", { name: "Next" }).click();

	const continueWithoutAnsweringButton = page.getByRole("button", {
		name: "Continue Without Answering",
	});
	if ((await continueWithoutAnsweringButton.count()) > 0) {
		await continueWithoutAnsweringButton.click();
	}
};

const waitForFormCompletion = async (page: Page) => {
	// TODO: resolve this function when the form is completed
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, 60000 * 1);
	});
}

export const completeForm = async ({
	page,
	payload,
}: { page: Page; payload: QualtricsOrderPayload }) => {
	const { orderData, formInputs } = payload;
	const { businessJustification } = resolveFinalConfig(
		orderData as GenerateOrderFormsInput,
	);
	await page.goto(QUALTRICS_ORDER_FORM_URL);

	await page
		.getByRole("textbox", { name: "Name of Jonsson School" })
		.fill(orderData.orgName);
	await clickNext(page);

	await page
		.getByRole("textbox", { name: "Student First Name" })
		.fill(orderData.contactName);
	await page
		.getByRole("textbox", { name: "Student Last Name" })
		.fill(orderData.contactName);
	await page
		.getByRole("textbox", { name: "Student NetID" })
		.fill(formInputs.netID);
	await page
		.getByRole("textbox", { name: "Student Email" })
		.fill(orderData.contactEmail);
	await page
		.getByRole("textbox", { name: "Name of Faculty Advisor" })
		.fill(formInputs.advisor.name);
	await page
		.getByRole("textbox", { name: "Email of Faculty Advisor (UTD" })
		.fill(formInputs.advisor.email);
	await page
		.getByRole("textbox", {
			name: "Event Name (If not an event, please specify request)",
		})
		.fill(formInputs.eventName);
	await page
		.getByRole("textbox", { name: "Date of Event (Format: MM/DD/" })
		.fill(formInputs.eventDate);
	await clickNext(page);

	// Items page
	const itemsSortedByVendor = Object.values(
		groupItemsByVendor(orderData.items),
	).flat();
	const truncatedItems = itemsSortedByVendor.slice(0, ORDER_ITEM_LIMIT);
	const remainingItems = itemsSortedByVendor.slice(ORDER_ITEM_LIMIT);
	for (let itemIndex = 0; itemIndex < truncatedItems.length; itemIndex++) {
		const displayIndex = itemIndex + 1;
		const item = truncatedItems[itemIndex];
		if (!item) continue;

		const nameWithNotes = item.notes
			? `${item.name} [NOTE: ${item.notes}]`
			: item.name;
		await page
			.getByRole("textbox", { name: `Item ${displayIndex} Name of Item` })
			.fill(nameWithNotes);
		await page
			.getByRole("textbox", { name: `Item ${displayIndex} URL Link` })
			.fill(item.url);
		await page
			.getByRole("textbox", { name: `Item ${displayIndex} Price of item` })
			.fill(item.pricePerUnitCents.toString());
		await page
			.getByRole("textbox", { name: `Item ${displayIndex} Quantity` })
			.fill(item.quantity.toString());

		const totalPrice = calculateOrderLineItemTotal(item);
		await page
			.getByRole("textbox", { name: `Item ${displayIndex} Total Price` })
			.fill(formatCentsAsDollarString(totalPrice));
	}
	await clickNext(page);

	if (remainingItems.length > 0) {
		const spreadsheet = await generateRemainingItemsExcel({
			items: remainingItems,
			orgName: orderData.orgName,
		});
		await page
			.getByRole("button", { name: "Drop files or click here to" })
			.setInputFiles(spreadsheet);
	}
	await clickNext(page);

	await page.getByText(formInputs.costCenter.type).click();
	if (formInputs.costCenter.type === "Other") {
		await page.getByTitle("Other").fill(formInputs.costCenter.value);
	}
	await page
		.getByRole("textbox", { name: "Please enter the justification" })
		.fill(businessJustification);

	await waitForFormCompletion(page);
};


export const launchBrowser = async () => {
	const browser = await chromium.launch({
		headless: false,
        slowMo: 1000,
        timeout: 60000 * 1,

	});
	const context = await browser.newContext();
	const page = await context.newPage();
	return { browser, context, page };
}

