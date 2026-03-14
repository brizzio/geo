# Strapi Products

Objective
- Centralize products in Strapi Cloud to be reused by multiple applications.
- Keep this app consuming products from Strapi API.

Suggested architecture
- Strapi Cloud: source of truth for products.
- Current app: read products from Strapi and cache locally if needed.
- Firebase: keep operational data (tenants, networks, stores, clusters, research services).

Initial steps
1. Create Product content-type in Strapi with current fields.
2. Add tenant/account relation field in Strapi (if multi-tenant by account is required).
3. Configure API token (read-only for this app).
4. Create integration layer in this app (`features/domain/services/strapi-products.js`).
5. Replace local product CRUD screens with Strapi sync mode (or keep hybrid mode during migration).

Notes
- You wrote "api do stripe"; assuming you meant Strapi API.
