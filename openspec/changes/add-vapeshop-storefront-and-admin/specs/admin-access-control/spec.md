## ADDED Requirements

### Requirement: Admin routes require an authenticated administrator

The system MUST protect every `/admin/*` route. Unauthenticated requests SHALL be redirected to sign in with a safe return path, authenticated non-admin requests SHALL be denied access to admin screens and data, and authenticated administrators SHALL be allowed to continue.

#### Scenario: Unauthenticated visitor requests an admin route
- **WHEN** a request for any `/admin/*` route has no valid session
- **THEN** the response redirects to the login page
- **AND** the callback destination is a same-site admin path
- **AND** no admin page content or data is returned

#### Scenario: Customer requests an admin route
- **WHEN** an authenticated customer requests any `/admin/*` route
- **THEN** access is denied with a safe redirect or forbidden response
- **AND** no admin content, analytics, customer PII, product mutation controls, or order data is returned

#### Scenario: Administrator requests an admin route
- **WHEN** an authenticated user with the current database role `ADMIN` requests an admin route
- **THEN** the request is allowed to render the admin experience

#### Scenario: Session is invalid or expired
- **WHEN** an admin route is requested with an expired, malformed, or revoked session
- **THEN** the user is treated as unauthenticated
- **AND** access to admin data is denied

### Requirement: Admin authorization is enforced beyond middleware

Every admin page, admin layout, admin route handler, and admin Server Action MUST perform an independent authorization check against the authenticated user's current database role. A valid customer JWT, a forged request, or a directly invoked mutation endpoint MUST NOT be able to read or modify admin resources. Unauthorized Server Actions and API routes SHALL return a forbidden result or status rather than a successful mutation.

#### Scenario: Customer invokes an admin Server Action directly
- **WHEN** an authenticated customer submits a crafted request to create/edit a product, adjust stock, or change an order status
- **THEN** the action rejects the request as forbidden
- **AND** no data is written and no revalidation implies success

#### Scenario: Stale or tampered role claim
- **WHEN** a request presents a token claiming `ADMIN` but the current database user is missing, disabled, or not an administrator
- **THEN** the server-side admin guard denies access
- **AND** no admin query or mutation executes

#### Scenario: Admin API route
- **WHEN** a non-admin requests an admin-only route handler, including a payment-proof retrieval URL
- **THEN** the handler returns an authorization failure without leaking protected data
- **AND** the denial is logged without sensitive payment or customer details

### Requirement: Administrator role provisioning is explicit

The system MUST support exactly two role values, `ADMIN` and `CUSTOMER`. Registration MUST create only customers. Administrator access SHALL only be established through a deliberate server-side bootstrap/seed or administrative database operation, never through public input or a client-side toggle.

#### Scenario: Public registration cannot create an admin
- **WHEN** a visitor registers through the public flow
- **THEN** the resulting user role is `CUSTOMER`
- **AND** attempts to submit an admin role are ignored or rejected

#### Scenario: Initial admin bootstrap
- **WHEN** the seed/bootstrap process is run with valid administrator credentials
- **THEN** an administrator account is created or promoted idempotently
- **AND** the credentials are not embedded in client code or committed to the repository

### Requirement: Admin access denial does not leak protected information

Authorization failures MUST NOT disclose customer contact details, order contents, payment references, product drafts, or internal errors. UI redirects may explain that access is unavailable, while API and action failures MUST use an appropriate non-success status/result.

#### Scenario: Denied admin page
- **WHEN** a non-admin is redirected from an admin route
- **THEN** the redirect does not include sensitive admin data in its URL or response body
- **AND** no admin data is serialized into the client payload

#### Scenario: Denied admin action
- **WHEN** an admin action is rejected for lack of authorization
- **THEN** the caller receives a generic forbidden message
- **AND** server logs record the authorization event without secrets or full payment references
