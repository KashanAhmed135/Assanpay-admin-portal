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
  fromDate,
  toDate,
  orderId,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ merchantId, subMerchantId, status, fromDate, toDate, orderId, page, size })
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

export async function fetchAdminUsers() {
  return apiRequest('/api/admin/users')
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
