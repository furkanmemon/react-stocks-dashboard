# Stock Dashboard (Finnhub)

This React dashboard lets you search stocks and load key quote, company, and fundamental metrics from Finnhub free APIs.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add your key:

```bash
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

3. Start the app:

```bash
npm run dev
```

## Features

- Symbol/company search with suggestions
- Live quote snapshot (price, change, day range, open, previous close)
- Company profile details
- Core financial metrics (P/E, EPS, P/B, beta, 52-week range, dividend yield)
