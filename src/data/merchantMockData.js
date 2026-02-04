const storageAvailable = typeof window !== 'undefined' && window.localStorage

const readStorage = (key, fallback) => {
    if (!storageAvailable) return fallback
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) {
            window.localStorage.setItem(key, JSON.stringify(fallback))
            return fallback
        }
        return JSON.parse(raw)
    } catch {
        return fallback
    }
}

export const collectionsData = readStorage('assanpay:collections', [
    { time: '09:12', date: '2026-01-22', orderId: 'ORD-20121', shop: 'Branch-01', amount: 3200, status: 'SUCCESS', providerRef: 'PR-8A7X' },
    { time: '10:05', date: '2026-01-22', orderId: 'ORD-20122', shop: 'Branch-02', amount: 5400, status: 'PENDING', providerRef: 'PR-7K1P' },
    { time: '12:18', date: '2026-01-21', orderId: 'ORD-20118', shop: 'Branch-03', amount: 1250, status: 'FAILED', providerRef: 'PR-1Z9Q' },
])

export const paymentsData = readStorage('assanpay:payments', [
    { date: '2026-01-22', merchantName: 'PIQ PAY', branchCode: 'BR-002', orderId: '10000112', amount: 5000.0, paymentMethod: 'Card' },
    { date: '2026-01-21', merchantName: 'DERIV', branchCode: 'BR-001', orderId: '10000111', amount: 2500.0, paymentMethod: 'Wallet' },
    { date: '2026-01-20', merchantName: 'AMANPAY', branchCode: 'BR-004', orderId: '10000110', amount: 12000.0, paymentMethod: 'Bank Transfer' },
])

export const adminRefundsData = readStorage('assanpay:adminRefunds', [
    {
        paymentId: 'PM-11021',
        merchantName: 'PIQ PAY',
        refundAmount: 1200.0,
        refundType: 'Partial',
        reason: 'Customer dispute',
        requestedBy: 'admin@assanpay.com',
        status: 'REQUESTED',
    },
    {
        paymentId: 'PM-11018',
        merchantName: 'DERIV',
        refundAmount: 2500.0,
        refundType: 'Full',
        reason: '',
        requestedBy: 'support@assanpay.com',
        status: 'APPROVED',
    },
])

export const refundsData = readStorage('assanpay:refunds', [
    { refundId: 'RF-201', date: '2026-01-22', orderId: 'ORD-20110', shop: 'Branch-01', amount: 1500, reason: 'Duplicate', status: 'REQUESTED' },
    { refundId: 'RF-202', date: '2026-01-21', orderId: 'ORD-20107', shop: 'Branch-03', amount: 2000, reason: 'Customer dispute', status: 'APPROVED' },
])

export const auditLogsData = readStorage('assanpay:auditLogs', [
    { entityType: 'REFUND', action: 'CREATE', performedBy: 'admin@assanpay.com', message: 'Refund requested PM-11021', createdAt: '2026-01-22 16:40:21' },
    { entityType: 'MERCHANT', action: 'UPDATE', performedBy: 'superadmin@assanpay.com', message: 'Updated settlement settings', createdAt: '2026-01-21 11:05:44' },
])

export const limitPoliciesData = readStorage('assanpay:limitPolicies', [
    { merchant: 'PIQ PAY', provider: 'JazzCash', period: 'Daily', maxAmount: 500000, maxTxn: 200, timezone: 'Asia/Karachi', weekStart: 'Monday', active: true },
    { merchant: 'DERIV', provider: 'EasyPaisa', period: 'Weekly', maxAmount: 1500000, maxTxn: 600, timezone: 'Asia/Karachi', weekStart: 'Monday', active: true },
])

export const paymentGateways = readStorage('assanpay:paymentGateways', [
    { key: 'jazzcash', label: 'JazzCash' },
    { key: 'easypaisa', label: 'EasyPaisa' },
    { key: 'switch', label: 'Switch' },
])

export const paymentMethodRows = readStorage('assanpay:paymentMethodRows', {
    jazzcash: [
        { id: 'jc-1', srNo: 1, merchantOf: 'ASSANPAY', username: 'jc_admin_01', storeId: 'JC-STORE-01', ewp: 'EWP-001', credentials: 'TOKEN-****' },
    ],
    easypaisa: [
        { id: 'ep-1', srNo: 1, merchantOf: 'ASSANPAY', username: 'ep_admin_01', storeId: 'EP-STORE-01', ewp: 'EWP-101', credentials: 'KEY-****' },
    ],
    switch: [
        { id: 'sw-1', srNo: 1, merchantOf: 'ASSANPAY', username: 'sw_admin_01', storeId: 'SW-STORE-01', ewp: 'EWP-201', credentials: 'CERT-****' },
    ],
})

export const settlementsData = readStorage('assanpay:settlements', [
    { settlementId: 'ST-2026-01', from: '2026-01-01', to: '2026-01-07', total: 420000, fees: 8400, net: 411600, status: 'PENDING' },
])

export const subMerchantsData = readStorage('assanpay:subMerchants', [
    { code: 'BR-01', name: 'Defence', status: 'Active', vol30: 520000, success: 98 },
    { code: 'BR-02', name: 'Clifton', status: 'Active', vol30: 410500, success: 97 },
])

export let usersData = readStorage('assanpay:users', [
    { name: 'Merchant Admin', username: 'abc_admin', role: 'MERCHANT_ADMIN', status: 'Active' },
    { name: 'Branch-01 Operator', username: 'br01_operator', role: 'SHOP_OPERATOR', status: 'Active' },
])

export let reportsData = readStorage('assanpay:reports', [
    { name: 'Collections Summary', range: 'Last 7 days', created: 'Today', status: 'READY' },
])

export const SHOP_OPTIONS = ['Branch-01', 'Branch-02', 'Branch-03']
export const COLLECTION_STATUS_OPTIONS = ['SUCCESS', 'PENDING', 'FAILED']
export const REFUND_STATUS_OPTIONS = ['REQUESTED', 'APPROVED', 'REJECTED']
export const SETTLEMENT_STATUS_OPTIONS = ['PENDING', 'PAID', 'FAILED']
export const USER_ROLE_OPTIONS = ['MERCHANT_ADMIN', 'SHOP_OPERATOR']
export const USER_STATUS_OPTIONS = ['Active', 'Blocked']
export const SUB_MERCHANT_STATUS_OPTIONS = ['Active', 'Blocked', 'Watch']

export const settlementReportsData = readStorage('assanpay:settlementReports', [
    {
        merchantName: 'PIQ PAY',
        settlementDate: '2026-01-22',
        transCount: 459,
        transAmount: 1837340.17,
        otpDeduction: 0,
        commission: 91109.4,
        commissionPct: 4.96,
        gst: 0,
        withholdingTax: 0,
        merchantAmount: 1746230.76,
    },
])

export const adminSubMerchantsData = readStorage('assanpay:adminSubMerchants', [
    { merchantId: '1001', branchCode: 'BR-01', branchName: 'Defence', merchantName: 'PIQ PAY', userEmail: 'branch.defence@piqpay.com', status: 'active', createdAt: '2026-01-15' },
    { merchantId: '1002', branchCode: 'BR-02', branchName: 'Clifton', merchantName: 'DERIV', userEmail: '', status: 'active', createdAt: '2026-01-17' },
])

export const adminUsersData = readStorage('assanpay:adminUsers', [
    { name: 'Ali Khan', email: 'ali.khan@assanpay.com', role: 'SUPER_ADMIN', status: 'ACTIVE', createdAt: '2026-01-12' },
    { name: 'Sara Ahmed', email: 'sara.ahmed@assanpay.com', role: 'OPS', status: 'ACTIVE', createdAt: '2026-01-18' },
])

export const adminInquiriesData = readStorage('assanpay:adminInquiries', [
    { ticketId: 'TCK-1001', subject: 'Settlement delay', merchantName: 'PIQ PAY', priority: 'High', status: 'Open', createdAt: '2026-01-22' },
    { ticketId: 'TCK-1002', subject: 'Chargeback query', merchantName: 'DERIV', priority: 'Medium', status: 'In Progress', createdAt: '2026-01-21' },
])
