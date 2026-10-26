## ADDED Requirements

### Requirement: Searchable and paginated product listing

The admin product area MUST provide a datatable of products with server-driven search and pagination. Search SHALL match product name and variant SKU. Rows SHALL expose image thumbnail, name, category, active/featured state, display price, total stock, and low-stock indication. Search/page state MUST be reflected in navigation and recovered after editing.

#### Scenario: Browsing the product table
- **WHEN** an administrator opens product management
- **THEN** products are listed in a stable order with the required identifying, price, stock, and status columns
- **AND** pagination controls show the current page and total result count
- **AND** changing page loads the corresponding server result set

#### Scenario: Searching products
- **WHEN** an administrator searches by product name or SKU
- **THEN** the list contains only matching products
- **AND** the pagination reflects the filtered result set
- **AND** the search term remains visible in the control

#### Scenario: No matching products
- **WHEN** a search or empty catalog yields no products
- **THEN** the table renders a clear empty state
- **AND** the administrator can clear the search without losing the page

### Requirement: Administrators can create products with variants

Administrators MUST be able to create a product through a dialog containing name, brand, category, descriptions, featured/active settings, one or more variants, and optional image uploads. A product SHALL only be publishable when it has at least one active variant with a unique SKU and at least one image with alt text. The server SHALL validate all fields, uniqueness, and monetary/stock minimums before writing.

#### Scenario: Valid product creation
- **WHEN** an administrator submits valid product details, at least one valid variant, and a supported image with alt text
- **THEN** the product and its variants/images are persisted in one successful operation
- **AND** the dialog closes or reports success
- **AND** the admin product list, storefront catalog, product page, landing page, and dashboard product metric are revalidated as applicable
- **AND** the new draft/live state is correctly reflected on the storefront

#### Scenario: Product requires at least one variant
- **WHEN** an administrator attempts to publish a product without an active variant
- **THEN** the server rejects publication with an actionable field error
- **AND** no storefront-visible product is created

#### Scenario: Duplicate slug or SKU
- **WHEN** the product slug or any variant SKU conflicts with another record
- **THEN** the request is rejected
- **AND** no product, variant, or image relation is partially written

#### Scenario: Invalid monetary or stock values
- **WHEN** a variant price, stock quantity, or low-stock threshold is negative or otherwise invalid
- **THEN** the server rejects the form with field-level feedback
- **AND** no data is persisted

#### Scenario: Publication without image
- **WHEN** an administrator attempts to set a product active without at least one image with descriptive alt text
- **THEN** publication is rejected with guidance
- **AND** the product remains a draft or inactive

### Requirement: Administrators can edit, archive, and safely remove products

Administrators MUST be able to edit product attributes and variants. Products with order history MUST NOT be hard-deleted; instead they SHALL be archived by deactivating the product and its variants so they disappear from new-purchase surfaces while historical orders remain intact. Unreferenced products MAY be permanently deleted through a confirmed action.

#### Scenario: Editing a product
- **WHEN** an administrator saves valid changes to an existing product or variant
- **THEN** the changes persist
- **AND** affected admin and storefront surfaces are revalidated
- **AND** any open product page reflects the updated content or availability on its next request

#### Scenario: Archiving a product
- **WHEN** an administrator archives a product
- **THEN** the product and its variants are no longer purchasable or listed as active storefront products
- **AND** existing orders and their line snapshots remain unchanged
- **AND** the product remains visible in admin history/reporting as inactive

#### Scenario: Deleting a product with order history
- **WHEN** an administrator requests deletion of a product referenced by an order
- **THEN** the destructive deletion is refused or converted to archiving
- **AND** historical order data is preserved

#### Scenario: Permanently deleting an unreferenced product
- **WHEN** an administrator confirms deletion of a product with no order references
- **THEN** the product, its variants, and its image relations are removed without affecting any order
- **AND** affected admin and storefront surfaces are revalidated

### Requirement: Inventory and low-stock thresholds are managed safely

Administrators MUST be able to adjust variant stock and configure a low-stock threshold. Stock adjustments MUST be whole integers, MUST never produce negative stock, and MUST be reflected in storefront availability and low-stock analytics after revalidation.

#### Scenario: Adjusting stock
- **WHEN** an administrator saves a valid non-negative stock quantity for a variant
- **THEN** the new stock is persisted
- **AND** affected product, catalog, and admin surfaces are revalidated
- **AND** the variant's stock badge updates on the next storefront request

#### Scenario: Attempting negative stock
- **WHEN** an administrator submits a negative stock value
- **THEN** the action rejects it with feedback
- **AND** the existing stock value is unchanged

#### Scenario: Low-stock warning
- **WHEN** a variant's stock becomes equal to or below its threshold
- **THEN** the admin product view visibly labels it as low stock
- **AND** it contributes to the dashboard low-stock alert count on a revalidated request

#### Scenario: Replenishing stock
- **WHEN** stock is raised above the low-stock threshold
- **THEN** the low-stock indicator is removed after revalidation

### Requirement: Product images use controlled uploads

Product image uploads MUST use server-issued, short-lived Cloudinary signatures available only to administrators. The system SHALL restrict accepted formats and size, require descriptive alt text, and support ordered gallery images per product and optional variant association. Failed uploads MUST NOT discard the rest of the product form.

#### Scenario: Successful image upload
- **WHEN** an administrator selects a supported image within the size limit and supplies alt text
- **THEN** the image uploads directly to the configured media service and is associated with the product
- **AND** the asset is registered with its owner, kind, Cloudinary identifier, and metadata
- **AND** the image can be previewed/ordered in the product form

#### Scenario: Non-admin requests an upload signature
- **WHEN** a customer or unauthenticated caller requests a product-image signature
- **THEN** the request is denied
- **AND** no upload credential is issued

#### Scenario: Unsupported or failed upload
- **WHEN** the selected file is unsupported, too large, interrupted, or rejected by the media service
- **THEN** the form shows a safe upload error
- **AND** other entered product fields remain intact

#### Scenario: Missing alt text
- **WHEN** an administrator attempts to publish with an image that lacks descriptive alt text
- **THEN** validation blocks publication until alt text is supplied

### Requirement: Product mutations provide safe, immediate feedback

Product create/edit/archive/stock actions MUST return discriminated typed results with field or form errors rather than throwing raw database errors to the client. Successful mutations MUST revalidate the relevant admin and storefront paths and display a success confirmation.

#### Scenario: Validation failure
- **WHEN** a product or stock action receives invalid input
- **THEN** the action returns a non-success result with accessible field errors
- **AND** no corresponding success revalidation or optimistic success message occurs

#### Scenario: Unexpected persistence failure
- **WHEN** a product mutation fails because of an unexpected database or media error
- **THEN** the administrator receives a safe retry message
- **AND** internal details and credentials are not exposed

#### Scenario: Successful mutation revalidation
- **WHEN** a product, variant, stock, or image mutation succeeds
- **THEN** `/admin/products`, the affected admin views, and the relevant storefront paths are revalidated
- **AND** the refreshed datatable shows the committed state
