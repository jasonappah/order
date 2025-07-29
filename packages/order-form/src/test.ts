import { type CometProject, generateOrderFormsForCRUTDProject } from "./generate-order-forms-for-crutd-project";
import fs from "node:fs/promises";
import { resolvePurchaseFormPdfOnServer } from "./generate-purchase-form-pdf";

(async () => {
    const project: CometProject = "Plant"
    const orderForms = await generateOrderFormsForCRUTDProject({
        items: [
            {
                name: 'Repeat Robotics Order for plants',
                vendor: 'Repeat Robotics',
                quantity: 1,
                url: ' https://repeat-robotics.com/checkout/order-pay/10134/?pay_for_order=true&key=wc_order_JuzOrVJjuSx0t',
                pricePerUnitCents: 55000,
                shippingAndHandlingCents: 500
            }
        ],
        project,
        contactName: "Jason Antwi-Appah",
        contactEmail: "jxa220013@utdallas.edu",
        contactPhone: "(615) 209-8642"
    }, resolvePurchaseFormPdfOnServer)

    for (const orderForm of orderForms) {
        await fs.writeFile(`${__dirname}/../out/${orderForm.filename}`, orderForm.pdfBuffer)
    }
})()    
    