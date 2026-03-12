# ZipHQ Dashboard

A Next.js 16 dashboard (React 19, Tailwind v4) for monitoring ZipHQ procurement tickets. It fetches data server-side directly from the ZipHQ API and displays ticket lists, status summaries, workflow breakdowns, and individual ticket detail views including vendor information and comment threads.

---

## Prerequisites

- **Node.js >= 20**
- A **ZipHQ API key** (Settings → API in your ZipHQ workspace)
- **1Password CLI** (`op`) is recommended for injecting secrets

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://git.internal/Gitea-Admin/ZIPHQ-MCP-Dash
cd ZIPHQ-MCP-Dash

# 2. Install dependencies
npm install

# 3. Set your API key
export ZIP_API_KEY=your-api-key-here

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ZIP_API_KEY` | Yes | — | ZipHQ API key (sent as `Zip-Api-Key` header on all server-side requests) |
| `ZIP_BASE_URL` | No | `https://api.ziphq.com` | ZipHQ API base URL |

These variables are consumed exclusively in server components (`src/lib/zip-api.ts` is marked `server-only`). They are never exposed to the browser.

For local development, create a `.env.local` file in the project root:

```bash
ZIP_API_KEY=your-api-key-here
# ZIP_BASE_URL=https://api.ziphq.com  # optional override
```

---

## Running the App

### Development

```bash
npm run dev
```

Starts the Next.js dev server at `http://localhost:3000` with hot reloading.

### Production build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout with top navigation bar
    page.tsx                # Dashboard home: summary cards + ticket table
    error.tsx               # Root error boundary
    loading.tsx             # Root loading state
    tickets/
      [id]/
        page.tsx            # Ticket detail view
        error.tsx           # Ticket-level error boundary
  components/
    attribute-panel.tsx     # Key/value attribute display
    comments-timeline.tsx   # Comment thread list
    status-badge.tsx        # Colored status pill
    summary-card.tsx        # Stat card (title, value, icon)
    ticket-table.tsx        # Paginated ticket list table
    vendor-card.tsx         # Vendor info card
  lib/
    zip-api.ts              # ZipHQ API client + type definitions
    utils.ts                # Shared utility functions
```

---

## Dashboard Pages

### Home (`/`)

Shows four summary cards (Total Tickets, Open, In Review, Pending Approvals), two breakdown charts (by status and by workflow), and a sortable table of recent tickets. Data is fetched server-side on each render with a 30-second revalidation window.

### Ticket Detail (`/tickets/:id`)

Shows the full ticket header (request number, status badge, workflow, requester, amount, created date), metadata fields (department, vendor, category, payment method, dates), an attribute panel for additional fields, a comments timeline, and a vendor info card if a vendor is linked. A direct "Open in Zip" link is shown when the ticket includes a `request_link`.

---

## API Client (`src/lib/zip-api.ts`)

All API calls go through `zipFetch`, which:

1. Checks that `ZIP_API_KEY` is set (throws with HTTP 401 if missing)
2. Builds the URL with query parameters
3. Sets the `Zip-Api-Key` header
4. Uses Next.js `fetch` with `{ next: { revalidate: 30 } }` for ISR-style caching
5. Throws a `ZipApiError` for non-2xx responses

Exported functions:

| Function | Description |
|---|---|
| `searchRequests(filters)` | List requests with optional filters |
| `getRequest(id)` | Fetch a single request by UUID |
| `getVendor(id)` | Fetch vendor details |
| `searchComments(requestGuid)` | Fetch comments for a request |
| `listWorkflows()` | List all workflows |
| `searchApprovals(filters)` | Search approval nodes |
| `formatEpoch(epoch)` | Format epoch seconds as a short date string |
| `formatEpochLong(epoch)` | Format epoch seconds as date + time |
| `formatCurrency(amount, currency)` | Format a currency amount string |
| `requesterName(req)` | Extract display name from a request's requester field |
| `getStatusInfo(status)` | Return label and Tailwind color class for a status integer |

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | App framework with React Server Components |
| `react` / `react-dom` | 19.2.3 | UI library |
| `tailwindcss` | ^4 | Utility-first CSS |
| `lucide-react` | ^0.577.0 | Icon library |
| `clsx` / `tailwind-merge` | latest | Class name utilities |
| `server-only` | ^0.0.1 | Enforces server-only module boundaries |
| `class-variance-authority` | ^0.7.1 | Variant-based class composition |
