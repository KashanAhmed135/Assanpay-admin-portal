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

export async function fetchMerchantUnsettledSummary({ fromDate, toDate } = {}) {
  const query = buildQuery({ fromDate, toDate })
  return apiRequest(`/api/settlements/unsettled-summary${query}`)
}

export async function fetchMerchantPayments({
  status,
  fromDate,
  toDate,
  orderId,
  page = 0,
  size = 50,
} = {}) {
  const query = buildQuery({ status, fromDate, toDate, orderId, page, size })
  return apiRequest(`/api/merchant/payments${query}`)
}
