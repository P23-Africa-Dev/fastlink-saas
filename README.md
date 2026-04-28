# Fastlink Platform

A modern SaaS dashboard built with Next.js, Tailwind CSS, and Recharts.

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org) (App Router)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Charts** — [Recharts](https://recharts.org)
- **Font** — [Geist](https://vercel.com/font) via `next/font`

## Features

- **Responsive layout** — mobile drawer, tablet overlay, collapsible desktop sidebar
- **Dark / Light / System theme** — defaults to light, persisted in `localStorage`
- **Dashboard widgets** — Task Breakdown (donut), Weekly Task Activity (composed chart), Project Health, CRM Pipeline, Recent Activity
- **Stats cards** — Total Leads, Total Projects, Pending Tasks with sparklines and trend indicators
- **Quick-access links** — All Projects, Kanban Board, Gantt Chart, CRM Pipeline inline with the page header
- **Brand design system** — `#021717` primary, `#1D6161` / `#D4CA5C` accents throughout

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```text
app/
├── components/
│   ├── Sidebar.tsx          # Collapsible sidebar with mobile/tablet drawer
│   ├── TopBar.tsx           # Top navigation bar
│   ├── DashboardShell.tsx   # Root layout shell
│   ├── StatsCard.tsx        # KPI stat cards with sparklines
│   └── ThemeProvider.tsx    # Theme context (light default)
├── dashboard/
│   ├── page.tsx             # Main dashboard page
│   └── widgets/
│       ├── TaskDonut.tsx        # Task breakdown donut chart
│       ├── WeeklyActivity.tsx   # 12-week composed bar/line chart
│       ├── ProjectHealth.tsx    # Project progress tracker
│       ├── LeadPipeline.tsx     # CRM funnel chart
│       └── RecentActivity.tsx   # Activity feed
└── globals.css
```

## Design Tokens

| Token   | Value     | Usage                                     |
| ------- | --------- | ----------------------------------------- |
| Primary | `#021717` | Sidebar bg, active states, brand accents  |
| Teal    | `#1D6161` | Chart bars (odd weeks), completed states  |
| Gold    | `#D4CA5C` | Chart bars (even weeks), logo subtitle    |
| Dark bg | `#0d1117` | Dark mode surface                         |
