## ADDED Requirements

### Requirement: Overview summary metrics

The admin overview MUST display server-computed metric cards for total sales, total orders, active products, and low-stock alerts. Values SHALL use PHP formatting, reflect only the defined qualifying records, and render zero/empty states rather than failing when there is no data.

#### Scenario: Populated overview
- **WHEN** an administrator opens the dashboard with orders, products, and stock data
- **THEN** total sales equals the sum of `PAID`, `SHIPPED`, and `DELIVERED` order totals
- **AND** total orders equals all orders except `CANCELLED`
- **AND** active products counts active products with at least one active variant
- **AND** low-stock alerts counts active variants whose stock is at or below their configured low-stock threshold
- **AND** monetary values are formatted as PHP

#### Scenario: Empty database
- **WHEN** an administrator opens the dashboard before any orders exist
- **THEN** all numeric cards display zero or a purposeful empty value
- **AND** the page renders without an exception

#### Scenario: Cancelled orders are excluded from sales
- **WHEN** the only recent orders are `CANCELLED` or `PENDING`
- **THEN** they do not contribute to total sales
- **AND** their statuses remain visible in the recent-orders area

### Requirement: Interactive sales chart

The overview MUST include an interactive chart of sales over the latest 30 calendar days using Recharts. Daily revenue SHALL include only sales-qualifying orders, be grouped in the `Asia/Manila` time zone, and include zero-value days so the time axis is continuous. The chart MUST expose a textual summary or empty state for accessibility.

#### Scenario: Thirty-day sales series
- **WHEN** the administrator views the overview
- **THEN** the chart displays daily sales and order data for each of the latest 30 calendar days
- **AND** days with no qualifying orders show zero rather than being omitted
- **AND** hovering or focusing a data point reveals its readable date and value
- **AND** the chart is accompanied by an accessible textual summary

#### Scenario: No sales in the period
- **WHEN** there are no sales-qualifying orders in the latest 30 days
- **THEN** the chart displays an intentional empty state or a flat zero series
- **AND** the page remains usable

### Requirement: Recent orders are immediately visible

The overview MUST show a recent-orders table with order identifier, customer, placed date, total, payment method, and current status. Each status SHALL be represented by a badge whose meaning is conveyed by text and colour. Recent orders MUST link to the full order view.

#### Scenario: Recent orders list
- **WHEN** the dashboard loads with existing orders
- **THEN** the most recent orders are shown newest first
- **AND** each row includes order number, customer, date, total, payment method, and a text status badge
- **AND** selecting a row opens that order's admin detail page

#### Scenario: Order status changes
- **WHEN** an administrator updates an order status or a verified card webhook changes it
- **THEN** the relevant admin dashboard and order-list surfaces are revalidated
- **AND** the next request displays the updated status badge

#### Scenario: No orders
- **WHEN** no orders exist
- **THEN** the recent-orders area shows a useful empty state
- **AND** the administrator has a clear path to the order list or storefront

### Requirement: Low-stock information is actionable

The overview MUST derive low-stock warnings from per-variant thresholds, excluding inactive variants. The alert count and any supporting list SHALL identify the affected products/variants so administrators can act.

#### Scenario: Variant reaches its threshold
- **WHEN** an active variant's stock is equal to or less than its low-stock threshold
- **THEN** it is included in the low-stock alert count
- **AND** its product/variant details are available from the admin overview or product administration
- **AND** inactive variants are excluded

#### Scenario: Stock is replenished
- **WHEN** an administrator raises stock above the threshold
- **THEN** a subsequent revalidated dashboard request removes that variant from the low-stock count
