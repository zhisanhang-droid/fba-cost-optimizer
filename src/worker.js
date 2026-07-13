import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { calculateCost, optimizeDimensions } from "./calculator.js";

const number = z.number().positive();
const inputSchema = {
  length: number.describe("包装后的长度"), width: number.describe("包装后的宽度"), height: number.describe("包装后的高度"), weight: number.describe("实际单件重量"),
  dimension_unit: z.enum(["in", "cm"]).default("in"), weight_unit: z.enum(["lb", "kg"]).default("lb")
};
const server = new McpServer({ name: "fba-cost-optimizer", version: "1.0.0" });
server.tool("calculate_fba_cost", "按 2026 美国 FBA（非服装）规则计算海运、配置费、配送费和总费用。售价区间和海运单价均为外部输入。", {
  ...inputSchema, season: z.enum(["regular", "peak"]).default("regular"), price_band: z.enum(["under_10", "10_to_50", "over_50"]).default("10_to_50"), sea_rate_per_kg: z.number().positive().default(1.5), placement: z.enum(["single", "split", "optimized"]).default("single")
}, async (args) => ({ content: [{ type: "text", text: JSON.stringify(calculateCost(args), null, 2) }] }));
server.tool("optimize_fba_dimensions", "识别 FBA 尺寸分段，并返回 18in、50lb、130in 围长、96in 等关键尺寸优化建议。", inputSchema, async (args) => ({ content: [{ type: "text", text: JSON.stringify(optimizeDimensions(args), null, 2) }] }));

const mcp = createMcpHandler(server);
export default { async fetch(request, env, ctx) { const url = new URL(request.url); if (url.pathname === "/mcp") return mcp(request, env, ctx); return env.ASSETS.fetch(request); } };
