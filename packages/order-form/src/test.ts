import { type CometProject, generateOrderFormsForCRUTDProject } from "./generate-order-forms-for-crutd-project";
import fs from "node:fs/promises";
import { generatePdfName } from "./utilities";

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
            }
        ],
        project,
        contactName: "Jason Antwi-Appah",
        contactEmail: "hey@jasonaa.me",
        contactPhone: "(555) 555-5555"
    })

    for (const orderForm of orderForms) {
        const fileName = `Comet Robotics ${generatePdfName(project, orderForm.vendor, orderForm.requestDate)}`
        await fs.writeFile(`${__dirname}/../out/${fileName}`, orderForm.pdf)
    }
})()    
    