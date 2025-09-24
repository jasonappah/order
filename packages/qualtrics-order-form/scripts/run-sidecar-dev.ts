import { main } from "../src/sidecar";
import data from "./sample-input";

console.table({now: new Date().toISOString()});
void main(["--json", JSON.stringify(data)], true);
