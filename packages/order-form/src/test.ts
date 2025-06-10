import { type CometProject, generateOrderFormsForCRUTDProject } from "./generate-order-forms-for-crutd-project";
import fs from "node:fs/promises";

(async () => {
    const project: CometProject = "SRP"
    const orderForms = await generateOrderFormsForCRUTDProject({
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
        project,
        contactName: "Jason Antwi-Appah",
        contactEmail: "hey@jasonaa.me",
        contactPhone: "(555) 555-5555"
    })

    for (const orderForm of orderForms) {
        await fs.writeFile(`${__dirname}/../out/${orderForm.filename}`, orderForm.pdfBuffer)
    }
})()    
    