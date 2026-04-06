# Pharma Manufacturer Module TODO

## Module Scope

- Public manufacturer application using the existing `PharmaManufacturerForm`
- Admin approval and document verification workflow
- Approval-aware manufacturer login and protected portal
- Manufacturer profile, documents, and compliance visibility
- Manufacturing capabilities and uploaded catalogue visibility
- Manufacturer-owned product management
- Manufacturer-routed website orders and lead handling
- Payments, settlements, and payout visibility
- Settings, password recovery, and account controls

## Phase 1

- Reuse existing registration form and wire it to local centralized API
- Persist all important form fields in backend
- Store uploaded compliance documents
- Enforce admin approval before manufacturer login
- Add protected manufacturer route and central session helper
- Replace hardcoded live URLs in manufacturer screens
- Make dashboard and profile use live backend data

## Next Steps

- Build premium manufacturer portal UI shell
- Add admin manufacturer review desk with approve/reject notes
- Add manufacturer product management using shared add-product engine
- Route website orders to manufacturer-owned products
- Add payments and settlement reporting
- Add forgot/reset password and notification flow
