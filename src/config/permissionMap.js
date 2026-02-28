export const ADMIN_PAGE_PERMISSIONS = {
  'page-dashboard': ['VIEW_MERCHANT', 'VIEW_PAYMENT', 'VIEW_SETTLEMENT', 'VIEW_REFUND', 'VIEW_RISK_DASHBOARD'],
  'page-merchants': ['VIEW_MERCHANT'],
  'page-create-merchant': ['CREATE_MERCHANT'],
  'page-submerchants': ['VIEW_SUB_MERCHANT', 'CREATE_SUB_MERCHANT'],
  'page-payments': ['VIEW_PAYMENT'],
  'page-reports': ['VIEW_REPORTS'],
  'page-settlements': ['VIEW_SETTLEMENT'],
  'page-refunds': ['VIEW_REFUND'],
  'page-webhooks': ['VIEW_PAYMENT', 'VIEW_WEBHOOK_OUTBOX'],
  'page-payment-methods': ['VIEW_PAYMENT_METHOD'],
  'page-limits': ['VIEW_LIMIT'],
  'page-users': ['VIEW_USERS'],
  'page-rbac': ['VIEW_RBAC'],
  'page-inquiries': ['VIEW_INQUIRY'],
  'page-audit-logs': ['VIEW_AUDIT_LOGS'],
  'page-risk': ['VIEW_RISK_DASHBOARD'],
  'page-settings': [],
}

export const MERCHANT_PAGE_PERMISSIONS = {
  dashboard: [],
  detail: [],
  'sub-merchants': ['VIEW_SUB_MERCHANT', 'MERCHANT_VIEW_SUB_MERCHANT', 'CREATE_SUB_MERCHANT', 'MERCHANT_CREATE_SUB_MERCHANT'],
  'create-sub-merchant': ['CREATE_SUB_MERCHANT', 'MERCHANT_CREATE_SUB_MERCHANT'],
  collections: ['VIEW_PAYMENT', 'MERCHANT_VIEW_PAYMENT'],
  refunds: ['VIEW_REFUND', 'MERCHANT_VIEW_REFUND', 'CREATE_REFUND', 'MERCHANT_CREATE_REFUND'],
  balance: ['VIEW_BALANCE', 'MERCHANT_VIEW_BALANCE', 'VIEW_SETTLEMENT', 'MERCHANT_VIEW_SETTLEMENT'],
  settlements: ['VIEW_SETTLEMENT', 'MERCHANT_VIEW_SETTLEMENT'],
  reports: ['VIEW_REPORTS', 'MERCHANT_VIEW_REPORTS'],
  'users-roles': ['VIEW_USERS', 'MERCHANT_VIEW_USERS', 'CREATE_USER', 'MERCHANT_CREATE_USER'],
  'api-keys': ['MERCHANT_ROTATE_API_KEY', 'ROTATE_API_KEY'],
  security: [],
}

export const ADMIN_PORTAL_PERMISSIONS = Object.values(ADMIN_PAGE_PERMISSIONS).flat()
export const MERCHANT_PORTAL_PERMISSIONS = Object.values(MERCHANT_PAGE_PERMISSIONS).flat()
export const SUB_MERCHANT_PORTAL_PERMISSIONS = MERCHANT_PORTAL_PERMISSIONS

