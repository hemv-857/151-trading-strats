# 151 Trading Strategies — Quant Research Terminal

[![Deployed on Vercel](https://img.shields.io/badge/Vercel-live-brightgreen)](https://151-trading-strats.vercel.app)
[![Deployed on Render](https://img.shields.io/badge/Render-live-blue)](https://one51-trading-strats.onrender.com)

**Live:** [Vercel](https://151-trading-strats.vercel.app) | [Render](https://one51-trading-strats.onrender.com)

An interactive companion to the paper **"151 Trading Strategies"** by Zura Kakushadze and Juan Andrey Serur (2018, [SSRN #3247865](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3247865)).

> **Reference:** Kakushadze, Z. & Serur, J.A. (2018). "151 Trading Strategies." *The Journal of Trading*, 13(4), pp. 26-46. Available at SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3247865

## What it does

| Feature | Description |
|---------|-------------|
| **Strategy Library** | 151 strategies across 18 asset classes with formulas, key concepts, and risk profiles |
| **Backtest Lab** | 10 backtestable strategies with equity curves, drawdown charts, monthly heatmaps, ACF/pACF, and rolling Sharpe |
| **Options Lab** | Black-Scholes pricing, 14 preset structures + custom strategy builder, Greeks visualization, volatility smile |
| **Compare Backtests** | Run 2–3 strategies side-by-side on the same price series |
| **Glossary** | 327+ quant finance definitions across 7 categories |
| **Strategy Graph** | Browse related strategies by shared key concepts |

## Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Recharts, Zustand
- **Backend:** Next.js API routes, Prisma (SQLite)
- **Data service:** Python yfinance microservice for real market data
- **Infrastructure:** Docker, Bun runtime

## Getting started

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Open http://localhost:3000
```

## Docker

```bash
docker compose up --build
```

## Paper citation

```
@article{kakushadze2018,
  title={151 Trading Strategies},
  author={Kakushadze, Zura and Serur, Juan Andrey},
  journal={The Journal of Trading},
  volume={13},
  number={4},
  pages={26--46},
  year={2018},
  note={SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3247865}
}
```

## License

MIT
