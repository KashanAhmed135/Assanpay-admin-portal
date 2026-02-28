# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## AssanPay Portal Notes

### Environment

- `VITE_API_BASE_URL` (example: `http://localhost:8080`)

### Auth + permissions model

**Routing structure**

- `src/App.jsx` defines routes with `react-router-dom` (login at `/`, merchant at `/merchant`, admin at `/admin`, public payment at `/pay`, checkout status routes, and `/forbidden`).

**Token storage**

- JWT is stored in `localStorage` under `assanpay_token` (see `src/utils/apiClient.js`).

**HTTP client**

- Centralized fetch wrapper in `src/utils/apiClient.js` adds `Authorization: Bearer <token>` and `X-REQUEST-ID` on each request, with global error handling.

**Route guards**

- `ProtectedRoute` in `src/components/auth/ProtectedRoute.jsx` gates portal routes using permission maps (see `src/config/permissionMap.js`).

**Role & permission checks**

- Permission gating uses `PermissionGate` with `canAny/canAll` (backed by `src/utils/permissions.js` and `src/utils/authStore.js`).

**Auth store**

- `src/utils/authStore.js` restores token on app start, fetches profile from `/api/admin/me` or `/api/merchant/me`, and builds a permissions map from `authorities` or `permissions`.
- Helpers: `can(permission)`, `canAny`, `canAll`.

**Auth endpoints used**

- `POST /api/auth/login`
- `GET /api/admin/me`
- `GET /api/merchant/me`

### Route → Permission Map

**Admin portal (`/admin`)**

- `/admin#page-dashboard` → any of `VIEW_MERCHANT`, `VIEW_PAYMENT`, `VIEW_SETTLEMENT`, `VIEW_REFUND`, `VIEW_RISK_DASHBOARD`
- `/admin#page-merchants` → `VIEW_MERCHANT`
- `/admin#page-create-merchant` → `CREATE_MERCHANT`
- `/admin#page-submerchants` → `VIEW_SUB_MERCHANT` or `CREATE_SUB_MERCHANT`
- `/admin#page-payments` → `VIEW_PAYMENT`
- `/admin#page-reports` → `VIEW_REPORTS`
- `/admin#page-settlements` → `VIEW_SETTLEMENT`
- `/admin#page-refunds` → `VIEW_REFUND`
- `/admin#page-webhooks` → `VIEW_PAYMENT` or `VIEW_WEBHOOK_OUTBOX`
- `/admin#page-payment-methods` → `VIEW_PAYMENT_METHOD`
- `/admin#page-limits` → `VIEW_LIMIT`
- `/admin#page-users` → `VIEW_USERS`
- `/admin#page-rbac` → `VIEW_RBAC`
- `/admin#page-inquiries` → `VIEW_INQUIRY`
- `/admin#page-audit-logs` → `VIEW_AUDIT_LOGS`
- `/admin#page-risk` → `VIEW_RISK_DASHBOARD`
- `/admin#page-settings` → any authenticated admin

**Merchant portal (`/merchant`, `/sub-merchant`)**

- `/merchant#dashboard` → any authenticated merchant
- `/merchant#detail` → any authenticated merchant
- `/merchant#sub-merchants` → `VIEW_SUB_MERCHANT` or `MERCHANT_VIEW_SUB_MERCHANT` or `CREATE_SUB_MERCHANT` or `MERCHANT_CREATE_SUB_MERCHANT`
- `/merchant#create-sub-merchant` → `CREATE_SUB_MERCHANT` or `MERCHANT_CREATE_SUB_MERCHANT`
- `/merchant#collections` → `VIEW_PAYMENT` or `MERCHANT_VIEW_PAYMENT`
- `/merchant#refunds` → `VIEW_REFUND` or `MERCHANT_VIEW_REFUND` or `CREATE_REFUND` or `MERCHANT_CREATE_REFUND`
- `/merchant#balance` → `VIEW_BALANCE` or `MERCHANT_VIEW_BALANCE` or `VIEW_SETTLEMENT` or `MERCHANT_VIEW_SETTLEMENT`
- `/merchant#settlements` → `VIEW_SETTLEMENT` or `MERCHANT_VIEW_SETTLEMENT`
- `/merchant#reports` → `VIEW_REPORTS` or `MERCHANT_VIEW_REPORTS`
- `/merchant#users-roles` → `VIEW_USERS` or `MERCHANT_VIEW_USERS` or `CREATE_USER` or `MERCHANT_CREATE_USER`
- `/merchant#api-keys` → `MERCHANT_ROTATE_API_KEY` or `ROTATE_API_KEY`
- `/merchant#security` → any authenticated merchant

### Permissions & Gating

UI visibility and routing are permission-driven. Pages are hidden when a required permission is missing.

**Admin pages → required permissions**

- Dashboard: any of `VIEW_MERCHANT`, `VIEW_PAYMENT`, `VIEW_SETTLEMENT`, `VIEW_REFUND`, `VIEW_RISK_DASHBOARD`
- Merchants: `VIEW_MERCHANT`
- Create Merchant: `CREATE_MERCHANT`
- Sub-Merchants: `VIEW_SUB_MERCHANT` or `CREATE_SUB_MERCHANT`
- Payments: `VIEW_PAYMENT`
- Reports: `VIEW_REPORTS`
- Settlements: `VIEW_SETTLEMENT`
- Refunds: `VIEW_REFUND`
- Webhooks: `VIEW_PAYMENT` (backend enforced)
- Risk Dashboard: `VIEW_RISK_DASHBOARD`
- Payment Methods: `VIEW_PAYMENT_METHOD`
- Limits: `VIEW_LIMIT`
- Users: `VIEW_USERS`
- RBAC: `VIEW_RBAC`
- Inquiries: `VIEW_INQUIRY`
- Audit Logs: `VIEW_AUDIT_LOGS`
- Settings: any authenticated admin

**Merchant pages → required permissions**

- Dashboard: any authenticated merchant user
- Sub-Merchants: `VIEW_SUB_MERCHANT` or `MERCHANT_VIEW_SUB_MERCHANT`
- Collections: `VIEW_PAYMENT` or `MERCHANT_VIEW_PAYMENT`
- Refunds: `VIEW_REFUND` / `CREATE_REFUND` (merchant equivalents)
- Balance: `VIEW_BALANCE` or `MERCHANT_VIEW_BALANCE` (falls back to settlement access)
- Settlements: `VIEW_SETTLEMENT` or `MERCHANT_VIEW_SETTLEMENT`
- Reports: `VIEW_REPORTS` or `MERCHANT_VIEW_REPORTS`
- Users & Roles: `VIEW_USERS` or `MERCHANT_VIEW_USERS`
- API Keys: `MERCHANT_ROTATE_API_KEY` or `ROTATE_API_KEY`
- Security: any authenticated merchant user

### Webhook Outbox Ops

Admin page uses:

- `GET /api/admin/webhooks`
- `POST /api/admin/webhooks/{eventId}/resend?resetAttempts=true`

### Risk Dashboard

Admin page uses:

- `GET /api/admin/merchant-risk`
- `POST /api/admin/merchant-risk/{merchantId}/override-risk`
- `POST /api/admin/merchant-risk/{merchantId}/override-reserve`
- `POST /api/admin/merchant-risk/{merchantId}/freeze-payout`

### Merchant Balance

- `GET /api/merchant/balance`
