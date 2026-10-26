## ADDED Requirements

### Requirement: Customer registration

Customers MUST be able to register with a name, email address, and password. The system MUST normalize and require a unique email, enforce a minimum password policy, hash passwords before storage, and always assign the `CUSTOMER` role. Registration MUST not accept or honour a requested elevated role.

#### Scenario: Successful registration
- **WHEN** a visitor submits a valid unused email, display name, and compliant password with matching confirmation
- **THEN** a customer account is created with the `CUSTOMER` role
- **AND** the password is stored only as a salted hash
- **AND** the visitor is directed to sign in with a success message

#### Scenario: Email already exists
- **WHEN** a visitor registers with an email that already belongs to an account, ignoring case
- **THEN** the registration is rejected with a non-enumerating account-exists message
- **AND** no duplicate account is created

#### Scenario: Invalid registration input
- **WHEN** required fields are missing, the email is malformed, the password is below the required length/limit, or confirmation does not match
- **THEN** the server rejects registration with field-level feedback
- **AND** no account is created

#### Scenario: Attempted role escalation
- **WHEN** registration input includes an administrator role or role override
- **THEN** the extra role value is ignored or rejected
- **AND** the created account remains a customer

### Requirement: Secure customer authentication

Registered customers MUST be able to sign in with valid credentials and sign out. Invalid credentials MUST fail with a generic message. Authenticated customers SHALL receive a session suitable for protected account and checkout routes, and protected routes MUST redirect unauthenticated visitors to sign in with a safe return path.

#### Scenario: Successful sign-in
- **WHEN** a customer submits a valid normalized email and matching password
- **THEN** a session is established
- **AND** the customer is redirected to a safe account, checkout, or storefront destination
- **AND** the session exposes the customer's ID and role to server-side authorization

#### Scenario: Invalid credentials
- **WHEN** a visitor submits an unknown email or incorrect password
- **THEN** authentication fails with a generic invalid-credentials message
- **AND** the system does not reveal whether the email exists

#### Scenario: Protected account route
- **WHEN** an unauthenticated visitor requests an account or order-history route
- **THEN** the visitor is redirected to sign in
- **AND** the callback destination remains a same-site relative path

#### Scenario: Sign out
- **WHEN** an authenticated customer signs out
- **THEN** the session is cleared
- **AND** subsequent account, checkout, and order routes require authentication again

### Requirement: Customers can view their order history

An authenticated customer MUST see a newest-first list of their own orders with order number, date, total, current status, and item summary. The list MUST be scoped to the authenticated user, and no order data may appear for another user.

#### Scenario: Viewing order history
- **WHEN** a signed-in customer opens the order-history page
- **THEN** only that customer's orders are listed, newest first
- **AND** each order displays its number, placed date, total, item summary, and current status
- **AND** an appropriate empty state is shown when the customer has no orders

#### Scenario: Order ownership is enforced
- **WHEN** a customer tries to access another customer's order or confirmation URL
- **THEN** the system denies access without revealing order, contact, shipping, or payment details
- **AND** no order record is returned to the client

### Requirement: Customers can track fulfillment status

The order detail view MUST show ordered items, quantities, prices, totals, the shipping snapshot, payment method, current status, and a chronological status timeline. Shipping statuses SHALL use the order's managed states and corresponding timestamps/events.

#### Scenario: Order detail and timeline
- **WHEN** a customer opens an order they own
- **THEN** the page shows all order lines, totals, shipping information, and payment method
- **AND** the timeline displays recorded status events from order placement onward
- **AND** the current fulfillment status is identifiable by text, not colour alone

#### Scenario: Status updates become visible
- **WHEN** an administrator changes an order's fulfillment status
- **THEN** the customer's order list/detail surfaces are revalidated
- **AND** the latest status and event appear on the next request without the customer changing data

### Requirement: Customers manage reusable addresses

Authenticated customers MUST be able to list, create, edit, delete, and designate a default shipping address. Each address MUST include recipient name, phone, street address, city/municipality, province, postal code, and country defaulting to the Philippines. Inputs MUST be validated, operations MUST be scoped to the owning customer, and at most one address per customer SHALL be the default.

#### Scenario: Adding a valid address
- **WHEN** a customer submits complete and valid address details
- **THEN** the address is saved to that customer
- **AND** it becomes selectable during checkout
- **AND** if it is the customer's first address or is marked default, it becomes the default

#### Scenario: Changing the default address
- **WHEN** a customer marks an address as default
- **THEN** the previous default is unset in the same operation
- **AND** exactly one of the customer's addresses is default afterward

#### Scenario: Invalid address
- **WHEN** required address fields are missing or malformed, such as an invalid phone or postal code
- **THEN** the server returns field-level validation feedback
- **AND** the address is not created or modified

#### Scenario: Cross-customer address access
- **WHEN** a customer tries to update, delete, or use an address owned by another account
- **THEN** the operation is rejected
- **AND** the other customer's address remains unchanged

#### Scenario: Deleting an address
- **WHEN** a customer deletes one of their saved addresses
- **THEN** it is removed from their address list
- **AND** previously placed orders retain their saved shipping-address snapshots
- **AND** a different address is selected as default when one remains

### Requirement: Account forms are accessible and resilient

Account, checkout, and address forms MUST use labelled controls, inline validation feedback, keyboard-operable actions, and safe server-side error handling. Validation failures MUST preserve non-sensitive entered values, and unexpected errors MUST not expose implementation details.

#### Scenario: Server validation error
- **WHEN** account, sign-in, or address form submission fails validation
- **THEN** the form remains usable with entered values preserved where safe
- **AND** the relevant fields are associated with accessible error messages

#### Scenario: Unexpected server failure
- **WHEN** an account action encounters an unexpected error
- **THEN** the customer sees a safe retry message
- **AND** no password, token, or internal stack trace is exposed
