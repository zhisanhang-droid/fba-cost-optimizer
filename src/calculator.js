const USD = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const ceilTo = (value, increment) => Math.ceil(value / increment) * increment;
const LB_PER_KG = 2.20462262;
const SEA_VOLUME_DIVISOR_CM3_PER_KG = 6000;

export const SEA_FREIGHT_TEMPLATES = [
  { id: "202607-lianyu-express", name: "202607-联宇-快船", warehouse: "GEU2", rate_per_kg_usd: 1.42, transit: "开船约18天签收", carrier: "快船" },
  { id: "202607-lianyu-oa", name: "202607-联宇-OA船司", warehouse: "GEU2", rate_per_kg_usd: 1.33, transit: "开船约22天签收", carrier: "OA船司" }
];

export const DEFAULT_SEA_FREIGHT_TEMPLATE_ID = "202607-lianyu-express";

export function normalizeInput(input) {
  let dimensions = [input.length, input.width, input.height].map(Number);
  if (dimensions.some((n) => !Number.isFinite(n) || n <= 0)) throw new Error("长、宽、高必须大于 0。");
  let weightLb = Number(input.weight);
  if (!Number.isFinite(weightLb) || weightLb <= 0) throw new Error("重量必须大于 0。");
  if (input.dimension_unit === "cm") dimensions = dimensions.map((n) => n / 2.54);
  if (input.weight_unit === "kg") weightLb *= LB_PER_KG;
  dimensions.sort((a, b) => b - a);
  return { length: dimensions[0], width: dimensions[1], height: dimensions[2], actualLb: weightLb, actualKg: weightLb / LB_PER_KG };
}

export function classifyProduct(input) {
  const x = normalizeInput(input);
  const { length: l, width: w, height: h, actualLb } = x;
  const girth = l + 2 * (w + h);
  const actualDimensionalLb = (l * w * h) / 139;
  const oversizeDimensionalLb = (l * Math.max(w, 2) * Math.max(h, 2)) / 139;
  let tier, dimensionalLb, shippingLb;
  if (actualLb <= 1 && l <= 15 && w <= 12 && h <= 0.75) {
    tier = "small_standard"; dimensionalLb = null; shippingLb = actualLb;
  } else if (l <= 18 && w <= 14 && h <= 8 && Math.max(actualLb, actualDimensionalLb) <= 20) {
    tier = "large_standard"; dimensionalLb = actualDimensionalLb; shippingLb = Math.max(actualLb, dimensionalLb);
  } else if (l <= 37 && w <= 28 && h <= 20 && girth <= 130 && Math.max(actualLb, oversizeDimensionalLb) <= 50) {
    tier = "small_oversize"; dimensionalLb = oversizeDimensionalLb; shippingLb = Math.max(actualLb, dimensionalLb);
  } else if (l <= 59 && w <= 33 && h <= 33 && girth <= 130 && Math.max(actualLb, oversizeDimensionalLb) <= 50) {
    tier = "large_oversize"; dimensionalLb = oversizeDimensionalLb; shippingLb = Math.max(actualLb, dimensionalLb);
  } else {
    dimensionalLb = actualLb > 150 ? null : oversizeDimensionalLb;
    shippingLb = actualLb > 150 ? actualLb : Math.max(actualLb, dimensionalLb);
    tier = shippingLb <= 50 ? "oversize_0_50" : shippingLb <= 70 ? "oversize_50_70" : shippingLb <= 150 ? "oversize_70_150" : "oversize_150_plus";
  }
  return { ...x, girth, dimensionalLb, shippingLb, tier, specialOversize: l > 96 || girth > 130 };
}

const standardSmall = {
  regular: [[2, 2.43, 3.32, 3.58], [4, 2.49, 3.42, 3.68], [6, 2.56, 3.45, 3.71], [8, 2.66, 3.54, 3.80], [10, 2.77, 3.68, 3.94], [12, 2.82, 3.78, 4.04], [14, 2.92, 3.91, 4.17], [16, 2.95, 3.96, 4.22]],
  peak: [[2, 2.62, 3.51, 3.77], [4, 2.68, 3.61, 3.87], [6, 2.76, 3.65, 3.91], [8, 2.86, 3.74, 4.00], [10, 2.98, 3.89, 4.15], [12, 3.03, 3.99, 4.25], [14, 3.14, 4.13, 4.39], [16, 3.17, 4.18, 4.44]]
};
const standardLarge = {
  regular: [[4, 2.91, 3.73, 3.99], [8, 3.13, 3.95, 4.21], [12, 3.38, 4.20, 4.46], [16, 3.78, 4.60, 4.86], [20, 4.22, 5.04, 5.30], [24, 4.60, 5.42, 5.68], [28, 4.75, 5.57, 5.83], [32, 5.00, 5.82, 6.08], [36, 5.10, 5.92, 6.18], [40, 5.28, 6.10, 6.36], [44, 5.44, 6.26, 6.52], [48, 5.85, 6.67, 6.93]],
  peak: [[4, 3.15, 3.97, 4.23], [8, 3.39, 4.21, 4.47], [12, 3.66, 4.48, 4.74], [16, 4.07, 4.89, 5.15], [20, 4.52, 5.34, 5.60], [24, 4.91, 5.73, 5.99], [28, 5.07, 5.89, 6.15], [32, 5.33, 6.15, 6.41], [36, 5.47, 6.29, 6.55], [40, 5.67, 6.49, 6.75], [44, 5.84, 6.66, 6.92], [48, 6.26, 7.08, 7.34]]
};
const oversized = {
  regular: { small_oversize: [[6.78, 7.55, 7.55], .38, 1], large_oversize: [[8.58, 9.35, 9.35], .38, 1], oversize_0_50: [[25.56, 26.33, 26.33], .38, 1], oversize_50_70: [[36.55, 37.32, 37.32], .75, 51], oversize_70_150: [[50.55, 51.32, 51.32], .75, 71], oversize_150_plus: [[194.18, 194.95, 194.95], .19, 151] },
  peak: { small_oversize: [[7.82, 8.59, 8.59], .38, 1], large_oversize: [[9.62, 10.39, 10.39], .38, 1], oversize_0_50: [[28.29, 29.06, 29.06], .38, 1], oversize_50_70: [[39.36, 40.13, 40.13], .75, 51], oversize_70_150: [[54.97, 55.74, 55.74], .75, 71], oversize_150_plus: [[202.69, 203.46, 203.46], .19, 151] }
};

function priceIndex(priceBand) { return priceBand === "under_10" ? 0 : priceBand === "over_50" ? 2 : 1; }
function lookup(table, ounces, column) { return table.find(([limit]) => ounces <= limit)?.[column + 1]; }

export function calculateFbaFee(product, { season = "regular", price_band = "10_to_50" } = {}) {
  const p = product, c = priceIndex(price_band), ounces = p.shippingLb * 16;
  let base, roundingRule = null;
  if (p.tier === "small_standard") base = lookup(standardSmall[season], ounces, c);
  else if (p.tier === "large_standard") {
    if (ounces <= 48) base = lookup(standardLarge[season], ounces, c);
    else { const start = season === "peak" ? [6.69, 7.51, 7.77][c] : [6.15, 6.97, 7.23][c]; base = start + Math.ceil((ounces - 48) / 4) * .08; roundingRule = "超过 3 lb 的部分按每 4 oz 向上取整"; }
  } else {
    const [starts, increment, included] = oversized[season][p.tier];
    const start = starts[c];
    base = start + Math.max(0, Math.ceil(p.shippingLb) - included) * increment;
    roundingRule = "超过首重的部分按每 lb 向上取整";
  }
  const surcharge = base * .035;
  const specialOversizeNote = p.specialOversize ? "特大号处理费未列于原始规则，当前 FBA 配送费未包含该附加费" : null;
  return { base_fee_usd: USD(base), fuel_logistics_surcharge_usd: USD(surcharge), total_fba_fee_usd: USD(base + surcharge), rounding_rule: roundingRule, note: specialOversizeNote };
}

export function calculatePlacementFee(product, placement = "single") {
  if (placement === "optimized") return 0;
  const weight = product.shippingLb;
  if (product.tier === "small_standard") return .32;
  if (product.tier === "large_standard") return weight <= .75 ? .40 : weight <= 1.5 ? .50 : weight <= 3 ? .60 : weight <= 5 ? .76 : weight <= 7 ? .98 : weight <= 10 ? 1.20 : weight <= 15 ? 1.50 : 1.90;
  const table = product.tier === "small_oversize" ? [[5, 1.60, 1.10], [12, 2.40, 1.75], [28, 3.50, 2.19], [42, 4.95, 2.83], [50, 5.95, 3.32]] : product.tier === "large_oversize" ? [[5, 1.80, 1.25], [12, 2.90, 1.80], [28, 4.10, 2.30], [42, 5.60, 2.95], [50, 6.50, 3.50]] : null;
  const row = table?.find(([limit]) => weight <= limit);
  return row ? row[placement === "split" ? 2 : 1] : null;
}

export function calculateCost(input) {
  const product = classifyProduct(input);
  const fba = calculateFbaFee(product, input);
  const placement = calculatePlacementFee(product, input.placement ?? "single");
  const templateId = input.sea_freight_template_id ?? DEFAULT_SEA_FREIGHT_TEMPLATE_ID;
  const seaTemplate = SEA_FREIGHT_TEMPLATES.find((template) => template.id === templateId);
  if (!seaTemplate && input.sea_freight_template_id) throw new Error("未找到指定的海运模板");
  const seaRate = Number(input.sea_rate_per_kg ?? seaTemplate?.rate_per_kg_usd);
  if (!Number.isFinite(seaRate) || seaRate <= 0) throw new Error("海运单价必须大于 0");
  const seaVolumetricWeightKg = product.length * 2.54 * product.width * 2.54 * product.height * 2.54 / SEA_VOLUME_DIVISOR_CM3_PER_KG;
  const seaChargeableWeightKg = Math.max(product.actualKg, seaVolumetricWeightKg);
  const sea = seaChargeableWeightKg * seaRate;
  const incomplete = placement === null || product.specialOversize;
  const notes = [placement === null ? "超大件配置费未包含：原始规则表未列出该区间费率。" : null, fba.note].filter(Boolean);
  return { product: { ...product, actualLb: USD(product.actualLb), actualKg: USD(product.actualKg), dimensionalLb: product.dimensionalLb === null ? null : USD(product.dimensionalLb), shippingLb: USD(product.shippingLb), girth: USD(product.girth) }, sea_template: seaTemplate ?? null, sea_rate_per_kg_usd: USD(seaRate), sea_actual_weight_kg: USD(product.actualKg), sea_volumetric_weight_kg: USD(seaVolumetricWeightKg), sea_chargeable_weight_kg: USD(seaChargeableWeightKg), sea_volume_divisor_cm3_per_kg: SEA_VOLUME_DIVISOR_CM3_PER_KG, sea_freight_usd: USD(sea), placement_fee_usd: placement === null ? null : USD(placement), fba, total_usd: incomplete ? null : USD(sea + placement + fba.total_fba_fee_usd), note: notes.length ? notes.join("；") : null };
}

export function optimizeDimensions(input) {
  const p = classifyProduct(input), warnings = [];
  if (p.length > 17.5 && p.length <= 18 || p.width > 13.5 && p.width <= 14 || p.height > 7.5 && p.height <= 8) warnings.push("接近大号标准尺寸边界：建议至少留出 0.5 in 包装余量。");
  if (p.shippingLb > 49 && p.shippingLb <= 50) warnings.push("接近 50 lb 边界：建议计费重控制在 49.5 lb 以下。");
  if (p.girth > 125 && p.girth <= 130) warnings.push("接近 130 in 长度加围长边界：建议至少留出 5 in 余量。");
  if (p.length > 91 && p.length <= 96) warnings.push("接近 96 in 特大号边界：建议最长边控制在 95 in 以下。");
  return { tier: p.tier, length_plus_girth_in: USD(p.girth), shipping_weight_lb: USD(p.shippingLb), warnings, recommended_targets: { large_standard_max_in: [17.5, 13.5, 7.5], small_oversize_max_in: [36.5, 27.5, 19.5], large_oversize_max_in: [58.5, 32.5, 32.5], max_shipping_weight_lb: 49.5 } };
}
