import test from "node:test";
import assert from "node:assert/strict";
import { calculateCost, classifyProduct } from "../src/calculator.js";

test("exact 0.75 inch stays small standard", () => {
  const item = classifyProduct({ length: 7.36, width: 4.449, height: .75, weight: .201 });
  assert.equal(item.tier, "small_standard");
});
test("large standard uses actual dimensions for volumetric weight", () => {
  const item = classifyProduct({ length: 5.75, width: 1.61, height: .87, weight: .11 });
  assert.equal(item.tier, "large_standard");
  assert.ok(item.dimensionalLb < .1);
});
test("backend-style small standard fee includes 3.5 percent surcharge", () => {
  const result = calculateCost({ length: 7.36, width: 4.449, height: .75, weight: .201, price_band: "10_to_50" });
  assert.equal(result.fba.base_fee_usd, 3.42);
  assert.equal(result.fba.total_fba_fee_usd, 3.54);
});
