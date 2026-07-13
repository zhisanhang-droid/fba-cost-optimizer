---
name: fba-cost-calculator
description: Calculate 2026 US non-apparel FBA fulfillment, inbound-placement, and west-coast sea-freight estimates; identify FBA size tiers and optimize package dimensions. Use when a user supplies package length, width, height, weight, season, price band, or asks about 18-inch, 50-lb, 96-inch, or 130-inch thresholds.
---

Call the `calculate_fba_cost` MCP tool for a full cost estimate. Treat `price_band` (`under_10`, `10_to_50`, or `over_50`) and `sea_rate_per_kg` as external inputs; do not infer either from a listing price. The default sea rate is the source rule's US-west `$1.50/kg`. Call `optimize_fba_dimensions` when the user asks for packaging or dimension recommendations.

Use packaged dimensions, sort them automatically as long/medium/short, and report the returned size tier. Flag that oversized placement fees are unavailable when the MCP result returns `placement_fee_usd: null`.
