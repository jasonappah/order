import { generateRemainingItemsExcel } from "../src/generate-excel";
import data from "./sample-input";

console.table({now: new Date().toISOString()});

generateRemainingItemsExcel({
	items: data.orderData.items,
	orgName: data.orderData.orgName,
}).then((remainingItems) => {
	Bun.write(remainingItems.name, remainingItems.buffer);
});
