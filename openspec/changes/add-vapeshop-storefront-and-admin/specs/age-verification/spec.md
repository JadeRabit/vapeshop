## ADDED Requirements

### Requirement: 21+ entry gate

The storefront MUST present an age-verification interstitial before a visitor can interact with age-restricted storefront content. The interstitial SHALL identify the store, state the 21+ requirement and nicotine warning, and require an explicit affirmative action to continue.

#### Scenario: First-time visitor is blocked by the age gate
- **WHEN** a visitor without a valid age-verification record opens any storefront page
- **THEN** the 21+ interstitial is displayed as a blocking dialog
- **AND** page scrolling and interaction with catalog content behind the dialog are disabled
- **AND** no product can be added to the cart or purchased while the gate is unresolved

#### Scenario: Visitor confirms eligibility
- **WHEN** the visitor affirms that they are at least 21 years old and submits the gate
- **THEN** the interstitial closes without a full-page reload
- **AND** the storefront becomes interactive
- **AND** a valid age-verification record is persisted with the acceptance timestamp

#### Scenario: Visitor declines
- **WHEN** the visitor chooses to leave instead of affirming eligibility
- **THEN** the storefront content is not made available
- **AND** the browser is navigated away to the configured exit destination
- **AND** no affirmative age-verification record is stored

#### Scenario: Gate cannot be dismissed accidentally
- **WHEN** the visitor presses Escape, clicks outside the dialog, or activates a close control
- **THEN** the dialog remains unresolved
- **AND** the visitor must explicitly affirm eligibility or decline

### Requirement: Age verification persists for 30 days

Acceptance MUST persist in both a browser cookie and versioned local storage. A returning visitor with an unexpired, valid record SHALL not be prompted again; expired, cleared, or incompatible records MUST cause the gate to render again.

#### Scenario: Returning verified visitor
- **WHEN** a visitor with a valid age-verification record returns within 30 days
- **THEN** the interstitial is not shown
- **AND** the storefront is interactive immediately

#### Scenario: Verification expires
- **WHEN** the stored acceptance is older than 30 days
- **THEN** the age gate is shown on the next storefront visit
- **AND** the visitor must affirm eligibility again

#### Scenario: Stored record is missing or invalid
- **WHEN** the cookie or local-storage record is absent, malformed, or from an incompatible version
- **THEN** the age gate is shown regardless of the other storage mechanism
- **AND** acceptance refreshes both records

### Requirement: Age gate is accessible

The interstitial MUST use accessible dialog semantics, move focus into the dialog, trap focus while it is unresolved, announce its purpose to assistive technology, and return focus appropriately after resolution. Controls MUST be operable by keyboard and must not rely on animation or colour alone.

#### Scenario: Keyboard-only visitor
- **WHEN** a keyboard-only visitor reaches an unresolved age gate
- **THEN** focus enters the dialog and is contained within its eligible controls
- **AND** both affirm and decline actions are reachable in a logical order
- **AND** the visitor is not able to tab into the blocked storefront

#### Scenario: Reduced-motion preference
- **WHEN** the visitor has enabled reduced motion
- **THEN** the age gate still appears and functions without non-essential motion
- **AND** its warning and actions remain fully visible
