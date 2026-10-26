## ADDED Requirements

### Requirement: Searchable and filterable order queue

The admin order area MUST provide a paginated list of orders, searchable by order number, customer name/email, and filterable by order status. Each row SHALL show order number, customer, date, total, payment method, and a text-labelled status badge.

#### Scenario: Browsing orders
- **WHEN** an administrator opens order management
- **THEN** orders are listed newest first with clear order, customer, payment, total, date, and status information
- **AND** pagination reports and navigates the current result set

#### Scenario: Filtering by status
- **WHEN** an administrator filters by a valid order status
- **THEN** only orders with that status are shown
- **AND** the active filter is visible and can be cleared

#### Scenario: Searching orders
- **WHEN** an administrator searches by full or partial order number, customer name, or email
- **THEN** matching orders are returned using the server-side search
- **AND** the query state remains visible and pagination reflects the filtered set

#### Scenario: No matching orders
- **WHEN** the search/filter yields no orders
- **THEN** the page displays a clear empty state with a reset path

### Requirement: Full order investigation view

The admin order detail MUST show the order number, customer name/email/phone, shipping-address snapshot, line items with variant/SKU/quantity/prices, subtotal/shipping/total, payment method and reference where applicable, current status, and chronological status events. The view MUST be limited to authorized administrators.

#### Scenario: Opening an order
- **WHEN** an administrator opens an order detail
- **THEN** all customer contact, shipping, item, total, payment, and status-history information is displayed
- **AND** sensitive customer/payment data is not included in public cache or non-admin payloads

#### Scenario: Order includes an available payment proof
- **WHEN** a GCash order has a receipt asset
- **THEN** the administrator can request a short-lived authorized view/preview
- **AND** the proof is never exposed through a public permanent URL
- **AND** no receipt is fetched until the administrator requests the proof view

#### Scenario: Order does not exist
- **WHEN** an administrator requests a nonexistent order identifier
- **THEN** the admin area shows a not-found state
- **AND** no unrelated order data is returned

### Requirement: Payment proof retrieval is admin-only

GCash payment receipts MUST be retrievable only by an authenticated administrator. The storage reference SHALL remain server-side, and any generated signed access MUST be short-lived. Card payment data SHALL never be requested or displayed because card details are handled by the hosted provider.

#### Scenario: Authorized proof view
- **WHEN** an administrator activates a GCash proof preview
- **THEN** the server verifies the administrator and order, then issues a time-limited authorized media response
- **AND** the response is not cached publicly

#### Scenario: Unauthorized proof request
- **WHEN** an unauthenticated or customer session requests a proof or admin proof URL directly
- **THEN** access is denied
- **AND** no storage secret or permanent URL is exposed

### Requirement: Status transitions are validated and method-aware

Administrators MUST be able to advance an order only through allowed transitions. `PENDING` may become `PAID` or `CANCELLED`, with COD additionally allowed to become `SHIPPED`; `PAID` may become `SHIPPED` or `CANCELLED`; `SHIPPED` may become `DELIVERED`; `DELIVERED` and `CANCELLED` are terminal. GCash/card orders MUST NOT ship before paid, and card paid status SHALL only be set by verified provider webhooks. Invalid or forged transitions MUST be rejected server-side.

#### Scenario: Marking a GCash order paid after verification
- **WHEN** an administrator verifies a GCash order's reference/proof and selects the allowed paid transition
- **THEN** the order's status becomes `PAID` and a timestamp/event is recorded
- **AND** the admin and customer surfaces are revalidated

#### Scenario: Shipping an unpaid GCash or card order
- **WHEN** an administrator attempts to ship a GCash or card order that is still `PENDING`
- **THEN** the server rejects the transition
- **AND** the order remains pending

#### Scenario: Shipping a COD order
- **WHEN** a COD order is `PENDING` and the administrator chooses to ship it
- **THEN** the transition to `SHIPPED` is allowed
- **AND** the status event records the change

#### Scenario: Card payment state
- **WHEN** an administrator attempts to mark a card order `PAID` manually
- **THEN** the server rejects that manual transition
- **AND** only a signature-verified provider webhook can mark the card payment paid

#### Scenario: Delivering and terminal states
- **WHEN** an order is `SHIPPED` and the administrator marks it `DELIVERED`
- **THEN** the delivered timestamp/event is stored
- **AND** any further transition from `DELIVERED` is rejected

#### Scenario: Invalid transition
- **WHEN** a request attempts an unlisted or method-incompatible status change
- **THEN** the action returns a validation error
- **AND** the stored status remains unchanged

### Requirement: Cancellation restores stock exactly once

Cancelling an order MUST restore each ordered quantity to its variant and append a cancellation event. Cancellation SHALL execute transactionally with a fresh status check, and retries or repeated requests MUST NOT restore inventory more than once. Cancelling a terminal order MUST be rejected.

#### Scenario: Cancelling a pending order
- **WHEN** an administrator confirms cancellation of a pending order
- **THEN** the order becomes `CANCELLED` and a cancellation event is recorded
- **AND** every ordered variant's stock is incremented by its order quantity in the same transaction
- **AND** affected catalog, dashboard, admin order, and customer order views are revalidated

#### Scenario: Repeated cancellation
- **WHEN** cancellation is submitted again for an already cancelled order
- **THEN** the server rejects it
- **AND** stock is not restored a second time

#### Scenario: Cancelling a delivered order
- **WHEN** cancellation is requested for a delivered order
- **THEN** the transition is rejected
- **AND** stock and status remain unchanged

### Requirement: Admin order actions are auditable and one-click

Each successful status update MUST write an append-only order event containing the previous status, new status, actor, and timestamp. The primary status action MUST be available in one click for allowed transitions, with an explicit confirmation before cancellation. Successful updates MUST trigger server-side revalidation so admin tables, dashboard metrics, and customer order views reveal the new status without manual data changes.

#### Scenario: Successful one-click status update
- **WHEN** an administrator selects a valid next status and confirms any destructive action
- **THEN** the update is persisted with a corresponding `OrderEvent`
- **AND** a success confirmation is displayed
- **AND** the relevant admin and customer pages are revalidated immediately

#### Scenario: Failed status update
- **WHEN** a status update fails validation, authorization, or persistence
- **THEN** the order and event history remain unchanged
- **AND** the administrator receives an actionable, non-sensitive error

#### Scenario: Payment proof is required but absent
- **WHEN** an administrator attempts to transition a GCash order to `PAID` without a valid associated receipt
- **THEN** the action is rejected with a clear explanation
- **AND** the order remains `PENDING`
