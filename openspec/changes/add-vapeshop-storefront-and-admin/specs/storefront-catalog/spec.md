## ADDED Requirements

### Requirement: Branded landing page

The storefront home page MUST present the store's dark neon/vapor brand, a primary call to action, a promotional banner, the six published categories, and a curated selection of featured products. Only active featured products with available imagery SHALL be merchandised.

#### Scenario: Landing page merchandising
- **WHEN** a visitor opens the storefront home page
- **THEN** the page displays the brand hero, promotional content, category quick-links, and featured products
- **AND** the six categories are Nic Salts, Freebase, Pod Systems, Disposables, Mods & Tanks, and Coils/Accessories
- **AND** inactive or non-featured products do not appear in the featured rail

#### Scenario: No featured products
- **WHEN** no active products are marked as featured
- **THEN** the featured section renders a useful empty state and a link to browse the full catalog
- **AND** the landing page still renders without an error

#### Scenario: Category quick-link
- **WHEN** a visitor selects a category from the landing page
- **THEN** the catalog opens with that category preselected
- **AND** only products from that category and matching any additional filters are shown

### Requirement: Catalog lists purchasable products

The catalog MUST list active products that have at least one active variant and MUST expose category, display price, and availability. Out-of-stock products MAY remain discoverable but MUST not be presented as purchasable.

#### Scenario: Browsing the full catalog
- **WHEN** a visitor opens the catalog without filters
- **THEN** active products with at least one active variant are listed
- **AND** each product shows its category, lowest active-variant price, image, and stock status
- **AND** archived or fully inactive products are excluded

#### Scenario: Product is out of stock
- **WHEN** every active variant of a product has zero stock
- **THEN** the catalog labels the product as out of stock
- **AND** the product cannot be added directly to the cart from the catalog

#### Scenario: Product has mixed variant availability
- **WHEN** some active variants of a product have stock and others do not
- **THEN** the product remains discoverable and purchasable through its in-stock variants
- **AND** the out-of-stock variants remain visibly unavailable on the product detail page

### Requirement: Instant search and multi-facet filtering

The catalog MUST provide client-side instant text search and combinable filters for category, nicotine strength, flavor profile, price range, and stock status. Search and filters SHALL combine with AND semantics, expose the result count, and offer a way to clear all selected criteria.

#### Scenario: Instant text search
- **WHEN** a visitor types part of a product name, brand, or flavor in the catalog search field
- **THEN** visible results update immediately without a full page navigation
- **AND** matching is case-insensitive
- **AND** the result count reflects the filtered set

#### Scenario: Combined filters
- **WHEN** a visitor selects a category, nicotine strength, flavor profile, price range, and in-stock filter
- **THEN** only products satisfying every selected filter are displayed
- **AND** the active-filter state is visible
- **AND** clearing all filters restores the unfiltered catalog

#### Scenario: No matching products
- **WHEN** search and filter criteria match no products
- **THEN** the catalog shows a clear empty state with a reset action
- **AND** the visitor can return to the full catalog without losing the page

#### Scenario: Mobile filtering
- **WHEN** a visitor opens filters on a small viewport
- **THEN** the filters are accessible through a modal/sheet pattern with touch-sized controls
- **AND** applying or clearing filters updates the catalog without requiring page reload

### Requirement: Product detail with gallery and variants

Each active product MUST have a detail page with an image gallery, descriptive content, variants, current per-variant price and stock, and an add-to-cart action. Selecting a variant SHALL update the displayed price, stock status, SKU-specific image when available, and purchase eligibility.

#### Scenario: Viewing a product
- **WHEN** a visitor opens an active product detail page
- **THEN** the page shows the product name, brand, description, category, image gallery, rating summary, and variants
- **AND** the page has descriptive metadata and alt text for images
- **AND** the initial variant is the first purchasable variant when one exists

#### Scenario: Selecting a variant
- **WHEN** a visitor selects an available variant
- **THEN** the displayed price, stock badge, SKU label, and applicable image update to that variant
- **AND** the selected variant is the one added to the cart

#### Scenario: Selecting an unavailable variant
- **WHEN** a visitor selects or encounters a variant with zero stock or inactive status
- **THEN** the add-to-cart action is disabled for that variant
- **AND** the page clearly states why it cannot be purchased

#### Scenario: Gallery navigation
- **WHEN** a visitor uses thumbnail or keyboard controls to change the gallery image
- **THEN** the primary image updates and the selected thumbnail is visually and semantically indicated

### Requirement: Reviews are visible and trustworthy

The product detail page MUST show the aggregate rating, total review count, and newest-first customer reviews, or an explicit empty state. Ratings SHALL be constrained to whole numbers from one to five.

#### Scenario: Product has reviews
- **WHEN** a visitor opens a product with reviews
- **THEN** the page shows a correctly calculated average rating, review count, and review text
- **AND** reviews are ordered newest first
- **AND** ratings outside one to five are never displayed

#### Scenario: Product has no reviews
- **WHEN** a product has no reviews
- **THEN** the page shows an inviting empty state instead of a misleading zero-star score

### Requirement: Verified customers can submit one review

Only an authenticated customer with a paid, shipped, or delivered order containing the product SHALL be able to submit a review. Each customer MUST be limited to one review per product. The server SHALL validate ownership/eligibility, rating, title, and body before saving.

#### Scenario: Eligible customer submits a review
- **WHEN** a signed-in customer with a qualifying order submits a valid rating, title, and body for that product
- **THEN** the review is stored with the verified-purchase designation
- **AND** the product page rating summary and review list update
- **AND** any cache for that product page is revalidated

#### Scenario: Customer already reviewed the product
- **WHEN** a customer has an existing review for the product
- **THEN** the system prevents a second review for that product
- **AND** the product page no longer offers a new-review form to that customer

#### Scenario: Customer is not eligible
- **WHEN** a signed-in customer has not purchased the product in a paid, shipped, or delivered order
- **THEN** the review action is unavailable and the page explains that reviews are limited to verified purchasers

#### Scenario: Invalid review input
- **WHEN** a review is submitted with a missing rating, a rating outside one to five, or empty/over-limit text
- **THEN** the server rejects the request with field-level feedback
- **AND** no review is created or revalidated as successful
