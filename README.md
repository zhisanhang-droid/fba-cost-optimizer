# FBA Cost Optimizer

美国站非服装 FBA 成本计算与尺寸优化工具。网页部署在 Cloudflare 静态资源中，MCP 部署在同一个 Cloudflare Worker 的 `/mcp` 路径。

## MCP tools

- `calculate_fba_cost`: 海运、配置费、FBA 配送费与总费用。
- `optimize_fba_dimensions`: 尺寸分段与临界值优化建议。

售价区间和海运单价均为外部输入。`price_band` 可取 `under_10`、`10_to_50` 或 `over_50`；`sea_rate_per_kg` 默认采用原始规则中的美西 `$1.50/kg`，不从商品页面推断价格或运价。

## Connect an MCP client

After deployment, register this remote endpoint in an MCP client that supports Streamable HTTP:

```json
{
  "mcpServers": {
    "fba-cost-optimizer": {
      "url": "https://zhang-hai.com/fba/mcp"
    }
  }
}
```

## Development

```bash
npm install
npm test
npm run dev
```

Deploy with `npm run deploy` after authenticating Wrangler to the intended Cloudflare account. Configure the Worker custom domain `mcp.zhang-hai.com` and route `/mcp`; static assets are served at the Worker root.
