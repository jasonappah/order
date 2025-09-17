import { type Browser, chromium, type Page } from 'playwright';
import { resolveFinalConfig, type GenerateOrderFormsInput } from '../../order-form/src/generate-order-forms';
import { calculateOrderLineItemTotal, formatCentsAsDollarString, groupItemsByVendor } from '../../order-form/src/utilities';

const newInputs = {
    netID: 'dal000000',
    advisor: {
      name: 'Our Advisor',
      email: 'our.advisor@utdallas.edu',
    },
    eventName: 'Event Name',
    eventDate: '09/17/2025',
    costCenter: {
        type: 'Other',
        value: 'Gift cost center XYZ'
    } satisfies CostCenter
  }

  type CostCenter = {
    type: 'Student Organization Cost Center' | 'Jonsson School Student Council funding'
  } | {
    type: 'Other'
    value: string
  }

const testData: GenerateOrderFormsInput = {
    items: [
        {
            name: "Antenna",
            vendor: "Digikey",
            quantity: 1,
            url: "https://www.digikey.com/en/products/detail/antenna",
            pricePerUnitCents: 1023,
            shippingAndHandlingCents: 0
        },
        {
            name: "Intel Realsense D435i",
            vendor: "Digikey",
            quantity: 1,
            url: "https://www.digikey.com/en/products/detail/intel-realsense-d435i",
            pricePerUnitCents: 1000,
            shippingAndHandlingCents: 0
        },
        {
            name: 'Servo',
            vendor: 'Amazon',
            quantity: 1,
            url: 'https://www.amazon.com/dp/B0BQJYJYJY',
            pricePerUnitCents: 1000,
            shippingAndHandlingCents: 0
        },
        {
            name: "12v Boost Converter",
            notes: "When ordering, please select the color option '12V(no Pin)'. Thanks!",
            vendor: "AliExpress",
            quantity: 40,
            url: "https://www.aliexpress.us/item/2251832713406135.html",
            pricePerUnitCents: 308,
            shippingAndHandlingCents: 0
        }
    ],
    contactName: "Test Org Officer",
    contactEmail: `${newInputs.netID}@utdallas.edu`,
    contactPhone: "(555) 555-5555",
    orgName: "Testing Org"
}


const clickNext = async (page: Page) => {
    await page.getByRole('button', { name: 'Next' }).click();

    const continueWithoutAnsweringButton = page.getByRole('button', { name: 'Continue Without Answering' });
    if (await continueWithoutAnsweringButton.count() > 0) {
        await continueWithoutAnsweringButton.click();
    }
}

const QUALTRICS_ORDER_FORM_URL = 'https://utdallas.qualtrics.com/jfe/form/SV_ageFSxiqRIPXwfc';
const ORDER_ITEM_LIMIT = 10;

const completeForm = async ({ page }: { page: Page }) => {
    const { requestDate, businessJustification } = resolveFinalConfig(testData);
    await page.goto(QUALTRICS_ORDER_FORM_URL);

    await page.getByRole('textbox', { name: 'Name of Jonsson School' }).fill(testData.orgName);
    await clickNext(page);

    await page.getByRole('textbox', { name: 'Student First Name' }).fill(testData.contactName);
    await page.getByRole('textbox', { name: 'Student Last Name' }).fill(testData.contactName);
    await page.getByRole('textbox', { name: 'Student NetID' }).fill(newInputs.netID);
    await page.getByRole('textbox', { name: 'Student Email' }).fill(testData.contactEmail);
    await page.getByRole('textbox', { name: 'Name of Faculty Advisor' }).fill(newInputs.advisor.name);
    await page.getByRole('textbox', { name: 'Email of Faculty Advisor (UTD' }).fill(newInputs.advisor.email);
    await page.getByRole('textbox', { name: 'Event Name (If not an event,' }).fill(newInputs.eventName);
    await page.getByRole('textbox', { name: 'Date of Event (Format: MM/DD/' }).fill(newInputs.eventDate);
    await clickNext(page);


    // Items page
    const itemsSortedByVendor = Object.values(groupItemsByVendor(testData.items)).flat();
    const truncatedItems = itemsSortedByVendor.slice(0, ORDER_ITEM_LIMIT);
    const remainingItems = itemsSortedByVendor.slice(ORDER_ITEM_LIMIT);
    for (let itemIndex = 0; itemIndex < truncatedItems.length; itemIndex++) {
        const displayIndex = itemIndex + 1
        const item = truncatedItems[itemIndex]!

        const nameWithNotes = item.notes ? `${item.name} [NOTE: ${item.notes}]` : item.name;
        await page.getByRole('textbox', { name: `Item ${displayIndex} Name of Item` }).fill(nameWithNotes);
        await page.getByRole('textbox', { name: `Item ${displayIndex} URL Link` }).fill(item.url);
        await page.getByRole('textbox', { name: `Item ${displayIndex} Price of item` }).fill(item.pricePerUnitCents.toString());
        await page.getByRole('textbox', { name: `Item ${displayIndex} Quantity` }).fill(item.quantity.toString());

        const totalPrice = calculateOrderLineItemTotal(item)
        await page.getByRole('textbox', { name: `Item ${displayIndex} Total Price` }).fill(formatCentsAsDollarString(totalPrice));

    }
    await clickNext(page);

    if (remainingItems.length > 0) {
        // TODO: generate the excel spreadsheet if needed
        await page.getByRole('button', { name: 'Drop files or click here to' }).setInputFiles('jcef_42253.log');
    }
    await clickNext(page);

    await page.getByText(newInputs.costCenter.type).click();
    if (newInputs.costCenter.type === 'Other') {
        await page.getByTitle("Other").fill(newInputs.costCenter.value);
    }
    await page.getByRole('textbox', { name: 'Please enter the justification' }).fill(businessJustification);

}

async function launchBrowser() {
    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    return { browser, context, page };
}

async function waitForBrowserDisconnection(browser: Browser) {
    return new Promise(resolve => {
        browser.on('disconnected', () => {
            resolve(true);
        });
    });
}

const main = async () => {
    const { browser, context, page } = await launchBrowser();
    await completeForm({ page });

    // Here we wait so that the user can manually fill in the signature and cost center page.
    await waitForBrowserDisconnection(browser);
}

(async () => {
    await main();
})();