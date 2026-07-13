import test from "node:test";
import assert from "node:assert/strict";
import { calculateCost, calculateFbaFee, classifyProduct } from "../src/calculator.js";

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
test("under $10 price band uses the low-price 2026 rate", () => {
  const result = calculateCost({ length: 7.36, width: 4.449, height: .75, weight: .201, price_band: "under_10" });
  assert.equal(result.fba.base_fee_usd, 2.49);
  assert.equal(result.fba.total_fba_fee_usd, 2.58);
});
test("sea freight rate is an external input", () => {
  const result = calculateCost({ length: 7.36, width: 4.449, height: .75, weight: .201, sea_rate_per_kg: 1.47 });
  assert.equal(result.sea_rate_per_kg_usd, 1.47);
  assert.equal(result.sea_freight_usd, 0.13);
});
test("large oversize split placement uses the 42 to 50 lb rule", () => {
  const item = classifyProduct({ length: 59, width: 10, height: 10, weight: 45 });
  const result = calculateCost({ length: 59, width: 10, height: 10, weight: 45, placement: "split" });
  assert.equal(item.tier, "large_oversize");
  assert.equal(result.placement_fee_usd, 3.5);
});
test("all 2026 standard-size rate rows match the source tables", () => {
  const rows = {
    regular: {
      small: [[2, 2.43, 3.32, 3.58], [4, 2.49, 3.42, 3.68], [6, 2.56, 3.45, 3.71], [8, 2.66, 3.54, 3.80], [10, 2.77, 3.68, 3.94], [12, 2.82, 3.78, 4.04], [14, 2.92, 3.91, 4.17], [16, 2.95, 3.96, 4.22]],
      large: [[4, 2.91, 3.73, 3.99], [8, 3.13, 3.95, 4.21], [12, 3.38, 4.20, 4.46], [16, 3.78, 4.60, 4.86], [20, 4.22, 5.04, 5.30], [24, 4.60, 5.42, 5.68], [28, 4.75, 5.57, 5.83], [32, 5.00, 5.82, 6.08], [36, 5.10, 5.92, 6.18], [40, 5.28, 6.10, 6.36], [44, 5.44, 6.26, 6.52], [48, 5.85, 6.67, 6.93]]
    },
    peak: {
      small: [[2, 2.62, 3.51, 3.77], [4, 2.68, 3.61, 3.87], [6, 2.76, 3.65, 3.91], [8, 2.86, 3.74, 4.00], [10, 2.98, 3.89, 4.15], [12, 3.03, 3.99, 4.25], [14, 3.14, 4.13, 4.39], [16, 3.17, 4.18, 4.44]],
      large: [[4, 3.15, 3.97, 4.23], [8, 3.39, 4.21, 4.47], [12, 3.66, 4.48, 4.74], [16, 4.07, 4.89, 5.15], [20, 4.52, 5.34, 5.60], [24, 4.91, 5.73, 5.99], [28, 5.07, 5.89, 6.15], [32, 5.33, 6.15, 6.41], [36, 5.47, 6.29, 6.55], [40, 5.67, 6.49, 6.75], [44, 5.84, 6.66, 6.92], [48, 6.26, 7.08, 7.34]]
    }
  };
  const bands = ["under_10", "10_to_50", "over_50"];
  for (const [season, tables] of Object.entries(rows)) for (const [size, table] of Object.entries(tables)) for (const [ounces, ...fees] of table) for (const [index, price_band] of bands.entries()) {
    const tier = size === "small" ? "small_standard" : "large_standard";
    assert.equal(calculateFbaFee({ tier, shippingLb: ounces / 16, specialOversize: false }, { season, price_band }).base_fee_usd, fees[index]);
  }
});
test("all 2026 oversized base rates match the source tables", () => {
  const rows = {
    regular: { small_oversize: [[6.78, 7.55, 7.55], 1], large_oversize: [[8.58, 9.35, 9.35], 1], oversize_0_50: [[25.56, 26.33, 26.33], 1], oversize_50_70: [[36.55, 37.32, 37.32], 51], oversize_70_150: [[50.55, 51.32, 51.32], 71], oversize_150_plus: [[194.18, 194.95, 194.95], 151] },
    peak: { small_oversize: [[7.82, 8.59, 8.59], 1], large_oversize: [[9.62, 10.39, 10.39], 1], oversize_0_50: [[28.29, 29.06, 29.06], 1], oversize_50_70: [[39.36, 40.13, 40.13], 51], oversize_70_150: [[54.97, 55.74, 55.74], 71], oversize_150_plus: [[202.69, 203.46, 203.46], 151] }
  };
  const bands = ["under_10", "10_to_50", "over_50"];
  for (const [season, tiers] of Object.entries(rows)) for (const [tier, [fees, shippingLb]] of Object.entries(tiers)) for (const [index, price_band] of bands.entries()) {
    assert.equal(calculateFbaFee({ tier, shippingLb, specialOversize: false }, { season, price_band }).base_fee_usd, fees[index]);
  }
});
