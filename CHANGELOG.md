# Changelog

## 2026-03-12 — Dashboard components and Zip API client

- Added `src/lib/zip-api.ts` — server-only ZipHQ API client with typed response interfaces for requests, vendors, comments, workflows, and approvals
- Added `src/components/ticket-table.tsx` — responsive table with columns for request number, status, vendor, requester, amount, and created date; rows link to the detail view
- Added `src/components/status-badge.tsx` — colored pill component driven by the `REQUEST_STATUSES` map
- Added `src/components/summary-card.tsx` — stat card with title, value, subtitle, and optional icon accent color
- Added `src/components/vendor-card.tsx` — vendor info card used on the ticket detail page
- Added `src/components/attribute-panel.tsx` — key/value display panel for ticket metadata
- Added `src/components/comments-timeline.tsx` — chronological comment list with author and timestamp
- Added `src/app/page.tsx` — dashboard home with four summary cards (Total, Open, In Review, Pending Approvals), status and workflow breakdown bar charts, and the ticket table; uses React `Suspense` with a skeleton fallback
- Added `src/app/tickets/[id]/page.tsx` — full ticket detail view fetching request, vendor, and comments in parallel; includes an "Open in Zip" link when available
- Added error boundaries at the root and ticket detail level
- Configured Tailwind v4 with PostCSS, global CSS variables for light/dark theming
- Set `{ next: { revalidate: 30 } }` on all API fetch calls for ISR-style caching

## 2026-03-12 — Initial commit

- Bootstrapped Next.js 16 project (React 19, TypeScript, Tailwind v4) via `create-next-app`
