# Franchise TODO

## Foundation
- [x] Centralize franchise API and token handling.
- [x] Protect franchise routes and normalize route structure.
- [x] Lock franchise account login against blocked or inactive accounts.
- [x] Secure admin-only franchise list endpoint.
- [x] Fix franchise support ownership checks.

## Franchise Portal
- [x] Replace static dashboard with live metrics, status breakdown, and recent orders.
- [x] Add working payments page using centralized franchise APIs.
- [x] Improve inventory view to show actual product names and quantities.
- [x] Add profile update and password change flow.
- [x] Add document upload and KYC compliance workflow.
- [x] Add forgot-password and reset-password flow for franchise users.
- [x] Add richer order filters, exports, and printable invoice support.

## Admin Dashboard
- [x] Wire franchise requests, accounts, orders, reports, and support from admin dashboard.
- [x] Wire support ticket detail and admin reply flow.
- [x] Map "Assign zone" action to franchise order workflow.
- [x] Add franchise detail drawer with application answers and zone history.
- [x] Add admin payout and settlement visibility for franchise payments.

## Business Logic
- [x] Persist extra franchise application fields from the public form.
- [x] Align order status transitions used by the franchise workflow.
- [x] Add explicit settlement and commission rules instead of inferred payment summaries.
- [x] Add low-stock alert thresholds and restock actions for inventory.
- [x] Add rejection reasons and lifecycle notes for franchise applications.

## Phase 2 Enhancements
- [x] Upgrade franchise dashboard into an ops command center with payout, low-stock, restock, support, and quick-action alerts.
- [x] Upgrade franchise support into a filterable workspace with linked-order validation and richer ticket threads.
- [x] Polish franchise layout with responsive sidebar and smarter page-aware topbar.
