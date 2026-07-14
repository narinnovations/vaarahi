
## Scope

Add new admin modules **without touching** existing pages, URLs, sidebar layout, theme, fonts, or design. Sidebar simply gets new links appended, in the same style already used.

The existing `products.stock`, `orders`, `coupons`, `policies`, `banners`, `reels`, `settings` pages remain untouched.

## Database migrations (Supabase)

New tables (all with RLS: admin-only via `is_admin(auth.uid())`):

1. `suppliers` — name, phone, email, address, notes
2. `purchase_entries` — supplier_id, product_id, qty, unit_cost, purchase_date, notes
3. `stock_movements` — product_id, delta, reason (purchase/adjustment/sale/return), reference_id, note, user_id
4. `product_stock_meta` — product_id PK, reserved (int, default 0), low_stock_threshold (int, default 5)
5. `wishlists` — user_id, product_id
6. `reviews` — user_id, product_id, rating, title, body, approved
7. `customer_notes` — profile_id, note, author_id (for internal customer notes)
8. `notification_settings` — key PK, enabled (bool), channel, template (text) — seeded with defaults
9. `notification_log` — channel, subject, body, target, sent_at, status
10. `seo_entries` — scope ('home'|'category'|'product'|'page'), ref_id, meta_title, meta_description, keywords, canonical_url, og_image, robots, schema_json
11. `activity_logs` — user_id, action, entity, entity_id, ip, metadata jsonb, created_at
12. Extend `profiles` with `blocked bool default false` and `profiles` view of aggregates via SQL functions (`customer_stats(user_id)` returning total_orders, total_spent, last_order_at).
13. Extend `site_settings` — no schema change (JSON keys added: `payments`, `shipping_methods`, `email_smtp`, `sms_api`, `whatsapp_api`, `cloudinary`, `analytics`, `maintenance`, `currency`, `timezone`, `cod_enabled`, `razorpay`).

All new tables include `id uuid pk`, `created_at`, `updated_at` where relevant, GRANTs to `authenticated`/`service_role`, RLS enabled, and admin-only policies (using `public.is_admin(auth.uid())`).

DB triggers:
- On `order_items` INSERT with a placed order → insert `stock_movements` (delta = -qty, reason='sale').
- On `stock_movements` INSERT → update `products.stock` accordingly (atomic).
- On `orders` status→'cancelled' → reverse relevant movements.

## New admin routes (files under `src/routes/_authenticated/admin/`)

Grouped nav sections appended to existing sidebar (preserving current items):

**Inventory**
- `inventory.tsx` — dashboard (totals, low-stock count, out-of-stock count, recent movements)
- `inventory.products.tsx` — stock list w/ current/reserved/available, search, filter, pagination, CSV export
- `inventory.low-stock.tsx`
- `inventory.history.tsx`
- `inventory.adjust.tsx` — single + bulk increase/decrease with reason
- `inventory.suppliers.tsx` — CRUD
- `inventory.purchases.tsx` — CRUD, auto-creates stock movement

**Customers**
- `customers.tsx` — list (name, phone, email, orders, spent, last order, status), search, pagination
- `customers.$id.tsx` — details w/ tabs: Overview • Addresses • Orders • Wishlist • Reviews • Notes • CLV
- `customers.analytics.tsx` — growth, top spenders, retention chart

**Reports**
- `reports.tsx` — landing w/ cards for each report
- `reports.sales.tsx`, `reports.revenue.tsx`, `reports.gst.tsx`, `reports.orders.tsx`, `reports.products.tsx`, `reports.customers.tsx`, `reports.top-products.tsx`, `reports.top-customers.tsx`
- Date-range picker (day/week/month/year/custom), charts via `recharts`, CSV/Excel export (SheetJS), PDF via `window.print()` with print stylesheet

**Analytics**
- `analytics.tsx` — visitors, page views (from `activity_logs` + client pageview beacon), conversion, funnel, top products/categories, traffic sources, revenue & orders charts, GA/Meta Pixel placeholder inputs (reads from settings)

**Notifications**
- `notifications.tsx` — channels toggle (email/SMS/WhatsApp/push), event toggles (order/shipment/coupon/newsletter), templates editor, test-send button, log table

**SEO**
- `seo.tsx` — landing cards
- `seo.home.tsx`, `seo.categories.tsx`, `seo.products.tsx`, `seo.pages.tsx` — form: meta title, description, keywords, canonical, OG/Twitter, robots, JSON-LD, live preview snippet. Persist to `seo_entries`; consumed at runtime by route `head()`.

**Admin Users**
- `users.tsx` — list current admins, create/edit/delete admins, role (super_admin/admin/manager/staff/readonly), permissions matrix stored on `user_roles.permissions jsonb`
- `users.activity.tsx` — activity log viewer with filters

**System Settings** — extend existing `settings.tsx` with additional sections rendered via same `Card` component (no visual redesign): Payment Gateways (Razorpay keys, COD toggle), Shipping Methods, GST, Invoice (already exists), Currency, Timezone, Backup/Restore (JSON export/import buttons), Email SMTP, SMS API, WhatsApp Business API, Cloudinary, Storage, GA ID, Meta Pixel, Maintenance mode toggle.

**Activity Logs**
- `logs.tsx` — filtered list, IP/date/action/entity, CSV export

**Dashboard improvements** — extend existing `admin/index.tsx` with additional widgets appended below current content: Revenue chart (recharts), Orders chart, Top Products, Recent Orders (kept), Low Stock, Latest Customers, Today/Monthly revenue, Pending/Completed/Cancelled counts.

## Sidebar

Extend `nav` array in `src/routes/_authenticated/admin/route.tsx` with grouped headings. Same visual style (rose-gradient active state, rounded pill). Add lightweight `<section label>` dividers already matching current typography.

## Shared building blocks

- `src/components/admin/DataTable.tsx` — headless table w/ search, sort, pagination, CSV export
- `src/components/admin/DateRangePicker.tsx`
- `src/lib/csv.ts`, `src/lib/xlsx.ts` (using `xlsx` package), `src/lib/log.ts` (helper to insert into `activity_logs`)
- `src/hooks/useAdminPagination.ts`
- Install: `recharts`, `xlsx`, `date-fns` (already present likely)

## Order of implementation (single delivery)

1. Migration for all new tables + triggers + functions.
2. Extend sidebar nav.
3. Shared components + libs.
4. Build modules in this order: Inventory → Customers → Reports → Analytics → Notifications → SEO → Admin Users → System Settings extension → Activity Logs → Dashboard widgets.
5. Wire SEO entries into public route `head()` where applicable (home, product, category, static page).
6. Wire activity logging on existing admin mutations (products/orders/coupons/banners/settings) via a small `logAction()` helper.

## Non-goals

- No visual redesign of existing pages.
- No removal of any current admin page.
- No new auth flows — reuse existing `is_admin` gate.
- Real SMTP/SMS/WhatsApp sending is scaffolded as settings + queue; actual provider wiring requires secrets and is a follow-up.
- Backup/Restore = JSON export of selected tables and JSON import (best-effort), not full DB snapshots.

## Risks / notes

- This is a very large addition (30+ new files, one big migration). Given scope, expect multiple approval cycles for migrations and one long build turn. I will ship it in one go if approved.
- Please confirm before I start so we don't burn credits if you want any module removed or descoped.
