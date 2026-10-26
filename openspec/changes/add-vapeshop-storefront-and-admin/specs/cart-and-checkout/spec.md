## ADDED Requirements

### Requirement: Persistent variant-aware cart

The storefront MUST provide a cart that persists across navigation and browser reloads for the same browser. Cart lines SHALL be uniquely keyed by product variant and SHALL support adding, changing quantity, removing, and clearing. Quantities MUST be whole numbers of at least one and MUST not exceed the last known available stock.

#### Scenario: Adding products
- **WHEN** a visitor adds an available variant to the cart
- **THEN** a cart line for that variant is created or its quantity is incremented
- **AND** adding the same variant again does not create a duplicate line
- **AND** the cart count and merchandise subtotal update

#### Scenario: Cart survives navigation and reload
- **WHEN** a visitor reloads the page or navigates between storefront pages after adding items
- **THEN** the cart lines and quantities are restored
- **AND** the cart display hydrates without server/client rendering mismatch

#### Scenario: Updating quantity beyond available stock
- **WHEN** a visitor attempts to set a quantity above the known available stock or below one
- **THEN** the quantity is capped or rejected with clear feedback
- **AND** the visitor cannot create an invalid cart line from the UI

#### Scenario: Cart prices are informational
- **WHEN** the cart displays line prices or a subtotal
- **THEN** those values are derived from the stored display snapshot
- **AND** final pricing is explicitly revalidated with the server before order creation

### Requirement: Authenticated multi-step checkout

Checkout MUST require an authenticated customer and proceed through delivery/contact, payment, and review steps. Unauthenticated visitors SHALL be redirected to sign in with a safe return path, and their cart MUST remain available afterward. Each step MUST validate its inputs before allowing progression.

#### Scenario: Unauthenticated customer starts checkout
- **WHEN** a visitor without a session opens the checkout route
- **THEN** the visitor is redirected to login
- **AND** the post-login destination is the checkout route when the callback path is safe
- **AND** the cart is preserved

#### Scenario: Completing delivery details
- **WHEN** a customer selects a saved address or enters a valid delivery address and contact details
- **THEN** the customer can continue to payment
- **AND** required fields and format errors are announced without losing entered data

#### Scenario: Reviewing an order before submission
- **WHEN** the customer reaches the review step with a non-empty cart and valid delivery/payment selection
- **THEN** the review shows current line items, quantities, prices, shipping, total, delivery snapshot, and payment method
- **AND** the customer can go back to correct a previous step

#### Scenario: Checkout cannot proceed with an empty or unavailable cart
- **WHEN** the cart is empty or all of its lines have become inactive or unavailable
- **THEN** checkout prevents submission and offers a route back to the catalog
- **AND** no order is created

### Requirement: Server-authoritative quotes and orders

The server MUST recalculate product prices, availability, quantities, shipping, and the final total from database records before and during order placement. The client's displayed prices MUST never be trusted. Order creation MUST decrement stock and write the order, line snapshots, and initial status event atomically. Failed stock, validation, or price checks SHALL leave no partial order or stock mutation.

#### Scenario: Price changed before submission
- **WHEN** a variant's server-side price differs from the cart's display snapshot at checkout
- **THEN** the customer is shown the current authoritative quote before order submission
- **AND** the final order uses the server price, never the stale client value

#### Scenario: Another customer takes the last stock
- **WHEN** order placement cannot decrement every requested variant because of insufficient stock
- **THEN** the entire transaction is rolled back
- **AND** no order or partial stock decrement is persisted
- **AND** the customer receives a clear availability error

#### Scenario: Successful order creation
- **WHEN** all quote and stock checks pass and payment requirements for the selected method are satisfied
- **THEN** the order stores immutable product/variant name, SKU, unit price, quantity, and line-total snapshots
- **AND** the order stores a shipping-address and customer-contact snapshot
- **AND** each requested quantity is decremented from its variant's stock
- **AND** an initial `PENDING` order status event is recorded
- **AND** relevant admin and customer order surfaces are revalidated

#### Scenario: Duplicate submission
- **WHEN** the same checkout idempotency key is submitted more than once
- **THEN** only one order is created
- **AND** subsequent submissions return the existing order rather than decrementing stock again

### Requirement: Supported payment methods are explicit and safe

Checkout MUST offer Cash on Delivery, GCash, and card payment when each method is available. The selected method SHALL determine required payment metadata, initial order status, and confirmation instructions. Unsupported or unconfigured methods MUST be disabled rather than accepted.

#### Scenario: Cash on Delivery
- **WHEN** the customer places a valid order using Cash on Delivery
- **THEN** the order is created with `PENDING` status and no online payment requirement
- **AND** the confirmation explains that payment is collected on delivery
- **AND** GCash proof requirements are not applied

#### Scenario: Available payment options
- **WHEN** the payment step loads
- **THEN** Cash on Delivery and GCash are available
- **AND** card is available only when the hosted payment provider is configured
- **AND** any unavailable method is visibly disabled with an explanation

### Requirement: GCash payment evidence is private and verifiable

A GCash order MUST require a non-empty payment reference and a successfully uploaded receipt image owned by the authenticated customer. Receipt uploads MUST be limited to supported image types and size, stored with private delivery, and linked to the order without exposing a public URL. A GCash reference SHALL not be reused on another order. GCash orders MUST remain `PENDING` until an administrator verifies payment.

#### Scenario: Valid GCash submission
- **WHEN** an authenticated customer supplies a unique payment reference and a valid private receipt upload
- **THEN** the order is created with `PENDING` status and GCash payment metadata
- **AND** the confirmation explains that the order awaits manual payment verification
- **AND** the receipt is accessible only through admin-authorized retrieval

#### Scenario: Missing or invalid receipt
- **WHEN** a GCash submission omits the reference or receipt, uses an unsupported file type or oversize image, or references an upload not owned by the customer
- **THEN** the server rejects the order with field-level feedback
- **AND** no GCash order is created

#### Scenario: Duplicate GCash reference
- **WHEN** a GCash reference has already been attached to another order
- **THEN** the submission is rejected
- **AND** the customer is asked to provide the correct reference

#### Scenario: Receipt access
- **WHEN** a non-admin requests a payment receipt
- **THEN** access is denied
- **AND** no permanent public receipt URL is returned

### Requirement: Card payment uses hosted checkout and verified webhooks

Card payment MUST collect card details only in the payment provider's hosted checkout and MUST never persist raw card data in the application. A card order SHALL be created as `PENDING`, be marked `PAID` only after a signature-verified provider webhook, and handle duplicate webhook delivery idempotently. Expired or failed sessions MUST cancel the order and restore reserved stock exactly once.

#### Scenario: Customer chooses card
- **WHEN** card payment is enabled and the customer selects it for a valid order
- **THEN** a hosted checkout session is created for the server-calculated amount
- **AND** the customer is redirected to the provider to enter card details
- **AND** no card number, CVV, or expiry is stored by the storefront

#### Scenario: Card payment succeeds
- **WHEN** a valid provider webhook reports successful payment for a pending card order
- **THEN** the order transitions to `PAID` and records the payment timestamp and provider reference
- **AND** the customer and admin order views reflect the paid status
- **AND** delivery is not marked before an administrator ships the order

#### Scenario: Webhook is forged or delivered twice
- **WHEN** a webhook has an invalid signature or repeats an already-processed event/session
- **THEN** the request is rejected or acknowledged as already processed
- **AND** order status, payment timestamp, and stock are not changed more than once

#### Scenario: Card session expires
- **WHEN** a hosted card checkout expires or fails without payment
- **THEN** the pending order is cancelled through the verified provider event or the protected expiry job
- **AND** its stock is restored at most once
- **AND** the customer can see that payment did not complete

#### Scenario: Card is not configured
- **WHEN** required card-provider configuration is absent
- **THEN** card payment is not offered as a usable checkout method
- **AND** no order is created with an unfulfillable card payment method

### Requirement: Order confirmation is ownership-protected and method-aware

After an accepted order, the customer MUST be shown a confirmation that verifies ownership and presents the order number, ordered items, totals, delivery snapshot, and method-specific next steps. The cart SHALL be cleared only after the order is successfully accepted. A card order awaiting webhook confirmation SHALL display a processing state and refresh to its paid state when available.

#### Scenario: Successful order confirmation
- **WHEN** the authenticated owner opens the confirmation route for their accepted order
- **THEN** the page displays the confirmation details and current order/payment status
- **AND** the cart no longer contains the purchased items

#### Scenario: Failed submission
- **WHEN** checkout fails because of validation, stock, or payment-session creation
- **THEN** the cart remains intact
- **AND** no confirmation is shown as successful

#### Scenario: Another user attempts to view the confirmation
- **WHEN** an authenticated customer requests an order confirmation that does not belong to them
- **THEN** access is denied without revealing order or customer details

#### Scenario: Card confirmation before webhook
- **WHEN** the customer returns from hosted checkout before the paid webhook has been processed
- **THEN** the confirmation shows a payment-processing state and method-specific guidance
- **AND** it refreshes status without requiring the customer to place the order again

### Requirement: Delivered totals include only server-approved fees

The order subtotal MUST be the sum of server-authoritative line totals. Shipping MUST follow the configured flat fee and free-shipping threshold, and the total MUST equal subtotal plus shipping. Taxes and discounts are not added in this release.

#### Scenario: Standard and free shipping
- **WHEN** the authoritative subtotal is below or at/above the configured free-shipping threshold
- **THEN** the quote applies the flat shipping fee or zero shipping respectively
- **AND** the displayed and persisted total matches subtotal plus shipping
