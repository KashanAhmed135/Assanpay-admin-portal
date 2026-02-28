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

export async function fetchMerchantSubMerchants({
  page = 0,
  size = 50,
  branchCode,
  branchName,
  isBlocked,
  hasUser,
} = {}) {
  const query = buildQuery({ page, size, branchCode, branchName, isBlocked, hasUser })
  return apiRequest(`/api/merchant/sub-merchants${query}`)
}

export async function fetchMerchantSubMerchant(id) {
  return apiRequest(`/api/merchant/sub-merchants/${id}`)
}

export async function createMerchantSubMerchant(payload) {
  return apiRequest('/api/merchant/sub-merchants', {
    method: 'POST',
    body: payload,
  })
}

export async function updateMerchantSubMerchant(id, payload) {
  return apiRequest(`/api/merchant/sub-merchants/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function createMerchantSubMerchantUser(id, payload) {
  return apiRequest(`/api/merchant/sub-merchants/${id}/create-user`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchMerchantUnsettledSummary({ fromDate, toDate } = {}) {
  const query = buildQuery({ fromDate, toDate })
  return apiRequest(`/api/settlements/unsettled-summary${query}`)
}

export async function fetchMerchantPayments({
  status,
  paymentMethodName,
  fromDate,
  toDate,
  orderId,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ status, paymentMethodName, fromDate, toDate, orderId, page, size })
  return apiRequest(`/api/merchant/payments${query}`)
}

export async function fetchMerchantRefunds({
  status,
  fromDate,
  toDate,
  orderId,
  refundId,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ status, fromDate, toDate, orderId, refundId, page, size })
  return apiRequest(`/api/merchant/refunds${query}`)
}

export async function fetchMerchantSettlements({
  status,
  fromDate,
  toDate,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ status, fromDate, toDate, page, size })
  return apiRequest(`/api/settlements${query}`)
}

export async function fetchMerchantSettlementLedger({
  fromDate,
  toDate,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ fromDate, toDate, page, size })
  return apiRequest(`/api/settlements/ledger${query}`)
}

export async function fetchMerchantSettlementPayments(settlementId) {
  if (!settlementId) return []
  return apiRequest(`/api/settlements/${settlementId}/payments`)
}

export async function fetchMerchantBalance() {
  return apiRequest('/api/merchant/balance')
}

export async function initiateMerchantRefund(payload) {
  return apiRequest('/api/merchant/refunds', {
    method: 'POST',
    body: payload,
  })
}

export async function initiateMerchantRefundBulk(payload) {
  return apiRequest('/api/merchant/refunds/bulk', {
    method: 'POST',
    body: payload,
  })
}

export async function fetchMerchantUsers({
  role,
  blocked,
  hasUser,
  branchName,
  email,
  name,
  page = 0,
  size = 20,
} = {}) {
  const query = buildQuery({ role, blocked, hasUser, branchName, email, name, page, size })
  return apiRequest(`/api/merchant/users${query}`)
}

export async function createMerchantUser(payload) {
  return apiRequest('/api/merchant/users', {
    method: 'POST',
    body: payload,
  })
}

export async function rotateMerchantApiKeys() {
  return apiRequest('/api/merchant/api-keys/rotate', {
    method: 'POST',
  })
}

export async function changeMerchantPassword(payload) {
  return apiRequest('/api/merchant/me/change-password', {
    method: 'POST',
    body: payload,
  })
}
