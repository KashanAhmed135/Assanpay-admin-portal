import { apiRequest } from '../utils/apiClient'

const buildQuery = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export async function fetchAdminMerchants({ page = 0, size = 50, email, legalName, isBlocked, settlementMode } = {}) {
  const query = buildQuery({ page, size, email, legalName, isBlocked, settlementMode })
  return apiRequest(`/api/admin/merchants${query}`)
}

export async function fetchAdminPayments({
  merchantId,
  subMerchantId,
  status,
  paymentMethodName,
  fromDate,
  toDate,
  orderId,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({
    merchantId,
    subMerchantId,
    status,
    paymentMethodName,
    fromDate,
    toDate,
    orderId,
    page,
    size,
  })
  return apiRequest(`/api/admin/payments${query}`)
}

export async function fetchAdminMerchant(id) {
  return apiRequest(`/api/admin/merchants/${id}`)
}

export async function createAdminMerchant(payload) {
  return apiRequest('/api/admin/merchants', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminMerchant(id, payload) {
  return apiRequest(`/api/admin/merchants/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchAdminPaymentMethods() {
  return apiRequest('/api/admin/payment-methods')
}

export async function createAdminPaymentMethod(payload) {
  return apiRequest('/api/admin/payment-methods', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminPaymentMethodStatus(id, active) {
  return apiRequest(`/api/admin/payment-methods/${id}/status`, {
    method: 'PATCH',
    body: { active },
  })
}

export async function fetchAdminSubMerchants({
  page = 0,
  size = 50,
  merchantId,
  branchCode,
  branchName,
  isBlocked,
  hasUser,
} = {}) {
  const query = buildQuery({
    page,
    size,
    merchantId,
    branchCode,
    branchName,
    isBlocked,
    hasUser,
  })
  return apiRequest(`/api/admin/sub-merchants${query}`)
}

export async function fetchAdminSubMerchant(id) {
  return apiRequest(`/api/admin/sub-merchants/${id}`)
}

export async function createAdminSubMerchant(merchantId, payload) {
  return apiRequest(`/api/admin/merchants/${merchantId}/sub-merchants`, {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminSubMerchant(id, payload) {
  return apiRequest(`/api/admin/sub-merchants/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function createAdminSubMerchantUser(id, payload) {
  return apiRequest(`/api/admin/sub-merchants/${id}/create-user`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchAdminUsers() {
  return apiRequest('/api/admin/users')
}

export async function fetchAdminUser(id) {
  const query = buildQuery({ id })
  return apiRequest(`/api/admin/users${query}`)
}

export async function checkAdminUsernameAvailability(username) {
  const query = buildQuery({ username })
  return apiRequest(`/api/admin/users/username-availability${query}`)
}

export async function createAdminUser(payload) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminUser(id, payload) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchAdminRoles() {
  return apiRequest('/api/admin/roles')
}

export async function fetchAdminPermissions() {
  return apiRequest('/api/admin/permissions')
}

export async function createAdminRole(payload) {
  return apiRequest('/api/admin/roles', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminRolePermissions(roleId, payload) {
  return apiRequest(`/api/admin/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchAdminUnsettledSummary({ merchantId, fromDate, toDate } = {}) {
  const query = buildQuery({ merchantId, fromDate, toDate })
  return apiRequest(`/api/admin/settlements/unsettled-summary${query}`)
}

export async function fetchAdminDashboard({ merchantId, merchantEmail, merchantName, fromDate, toDate } = {}) {
  const query = buildQuery({ merchantId, merchantEmail, merchantName, fromDate, toDate })
  return apiRequest(`/api/admin/dashboard/v2${query}`)
}

export async function fetchAdminDashboardSummary({ merchantId, merchantEmail, merchantName, fromDate, toDate } = {}) {
  const query = buildQuery({ merchantId, merchantEmail, merchantName, fromDate, toDate })
  return apiRequest(`/api/admin/dashboard/summary${query}`)
}

export async function fetchAdminPaymentChart({ merchantId, fromDate, toDate } = {}) {
  const query = buildQuery({ merchantId, fromDate, toDate })
  return apiRequest(`/api/admin/dashboard/payments-chart${query}`)
}

export async function fetchAdminLimits({
  merchantId,
  merchantName,
  merchantEmail,
  paymentMethodId,
  paymentMethodName,
} = {}) {
  const query = buildQuery({
    merchantId,
    merchantName,
    merchantEmail,
    paymentMethodId,
    paymentMethodName,
  })
  return apiRequest(`/api/admin/limits${query}`)
}

export async function updateAdminLimit(merchantId, paymentMethodId, payload) {
  return apiRequest(`/api/admin/limits/merchants/${merchantId}/payment-methods/${paymentMethodId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchAdminSettlementSummary({ merchantName, merchantEmail, status } = {}) {
  const query = buildQuery({ merchantName, merchantEmail, status })
  return apiRequest(`/api/admin/settlements/summary${query}`)
}

export async function fetchAdminSettlementLedger({
  merchantId,
  fromDate,
  toDate,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ merchantId, fromDate, toDate, page, size })
  return apiRequest(`/api/admin/settlements/ledger${query}`)
}

export async function fetchAdminWebhooks({
  status,
  merchantId,
  orderId,
  paymentId,
  fromDate,
  toDate,
  page = 0,
  size = 20,
} = {}) {
  const query = buildQuery({
    status,
    merchantId,
    orderId,
    paymentId,
    fromDate,
    toDate,
    page,
    size,
  })
  return apiRequest(`/api/admin/webhooks${query}`)
}

export async function resendAdminWebhook(eventId, { resetAttempts = true } = {}) {
  const query = buildQuery({ resetAttempts })
  return apiRequest(`/api/admin/webhooks/${eventId}/resend${query}`, {
    method: 'POST',
  })
}

export async function fetchAdminMerchantRisk({
  riskLevel,
  merchantId,
  merchantName,
  payoutFreeze,
  page = 0,
  size = 20,
} = {}) {
  const query = buildQuery({
    riskLevel,
    merchantId,
    merchantName,
    payoutFreeze,
    page,
    size,
  })
  return apiRequest(`/api/admin/merchant-risk${query}`)
}

export async function overrideAdminRiskLevel(merchantId, level) {
  return apiRequest(`/api/admin/merchant-risk/${merchantId}/override-risk`, {
    method: 'POST',
    body: { level },
  })
}

export async function overrideAdminReservePercent(merchantId, percent) {
  return apiRequest(`/api/admin/merchant-risk/${merchantId}/override-reserve`, {
    method: 'POST',
    body: { percent },
  })
}

export async function freezeAdminPayout(merchantId, freeze, reason) {
  return apiRequest(`/api/admin/merchant-risk/${merchantId}/freeze-payout`, {
    method: 'POST',
    body: { freeze, reason },
  })
}

export async function applyAdminSettlementPayout(id, payload) {
  return apiRequest(`/api/admin/settlements/${id}/payout`, {
    method: 'POST',
    body: payload,
  })
}

export async function fetchAdminAuditLogs({
  entityType,
  action,
  performedBy,
  fromDate,
  toDate,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({
    entityType,
    action,
    performedBy,
    fromDate,
    toDate,
    page,
    size,
  })
  return apiRequest(`/api/admin/audit-logs${query}`)
}

export async function updateAdminUserBlock(id, blocked) {
  return apiRequest(`/api/admin/users/${id}/block`, {
    method: 'PATCH',
    body: { blocked },
  })
}

export async function updateAdminAutoSettlementPaused(merchantId, paused) {
  return apiRequest(`/api/admin/merchants/${merchantId}/auto-settlement`, {
    method: 'PATCH',
    body: { paused },
  })
}

export async function rotateAdminMerchantApiKeys(merchantId) {
  return apiRequest(`/api/admin/merchants/${merchantId}/api-keys/rotate`, {
    method: 'POST',
  })
}

export async function adminReauth(payload) {
  return apiRequest('/api/admin/reauth', {
    method: 'POST',
    body: payload,
  })
}

export async function previewAdminResetTest(merchantId) {
  return apiRequest(`/api/admin/backoffice/merchants/${merchantId}/reset-test/preview`, {
    method: 'POST',
  })
}

export async function executeAdminResetTest(merchantId, stepUpToken) {
  return apiRequest(`/api/admin/backoffice/merchants/${merchantId}/reset-test/execute`, {
    method: 'POST',
    headers: {
      'X-STEPUP-TOKEN': stepUpToken,
    },
  })
}

export async function adminGoLive(merchantId, stepUpToken) {
  return apiRequest(`/api/admin/backoffice/merchants/${merchantId}/go-live`, {
    method: 'POST',
    headers: {
      'X-STEPUP-TOKEN': stepUpToken,
    },
  })
}

export async function fetchAdminProfile() {
  return apiRequest('/api/admin/me')
}

export async function updateAdminProfile(payload) {
  return apiRequest('/api/admin/me', {
    method: 'PUT',
    body: payload,
  })
}

export async function changeAdminPassword(payload) {
  return apiRequest('/api/admin/me/change-password', {
    method: 'POST',
    body: payload,
  })
}
