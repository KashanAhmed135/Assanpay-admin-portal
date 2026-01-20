export const collectionsData = [
    { time: '12:40', date: '2026-01-10', orderId: 'ORD-10021', shop: 'Branch-01', amount: 2500, status: 'SUCCESS', providerRef: 'PR-8A7X' },
    { time: '12:38', date: '2026-01-10', orderId: 'ORD-10020', shop: 'Branch-02', amount: 12000, status: 'PENDING', providerRef: 'PR-7K1P' },
    { time: '12:35', date: '2026-01-10', orderId: 'ORD-10019', shop: 'Branch-03', amount: 1250, status: 'FAILED', providerRef: 'PR-1Z9Q' },
    { time: '12:31', date: '2026-01-09', orderId: 'ORD-10018', shop: 'Branch-01', amount: 4800, status: 'SUCCESS', providerRef: 'PR-0L2W' },
    { time: '12:27', date: '2026-01-09', orderId: 'ORD-10017', shop: 'Branch-02', amount: 9999, status: 'SUCCESS', providerRef: 'PR-3D8M' },
    { time: '12:22', date: '2026-01-08', orderId: 'ORD-10016', shop: 'Branch-01', amount: 1150, status: 'SUCCESS', providerRef: 'PR-4N2A' },
    { time: '12:18', date: '2026-01-08', orderId: 'ORD-10015', shop: 'Branch-03', amount: 7300, status: 'PENDING', providerRef: 'PR-5P8R' },
    { time: '12:12', date: '2026-01-07', orderId: 'ORD-10014', shop: 'Branch-02', amount: 3000, status: 'SUCCESS', providerRef: 'PR-6J3T' },
]

export const refundsData = [
    { refundId: 'RF-101', date: '2026-01-10', orderId: 'ORD-10011', shop: 'Branch-01', amount: 1500, reason: 'Duplicate', status: 'REQUESTED' },
    { refundId: 'RF-102', date: '2026-01-09', orderId: 'ORD-10007', shop: 'Branch-03', amount: 2000, reason: 'Customer dispute', status: 'APPROVED' },
    { refundId: 'RF-103', date: '2026-01-08', orderId: 'ORD-10005', shop: 'Branch-02', amount: 950, reason: 'Wrong amount', status: 'REJECTED' },
]

export const settlementsData = [
    { settlementId: 'ST-2026-01', from: '2026-01-01', to: '2026-01-07', total: 420000, fees: 8400, net: 411600, status: 'PENDING' },
    { settlementId: 'ST-2025-12', from: '2025-12-24', to: '2025-12-31', total: 390500, fees: 7810, net: 382690, status: 'PAID' },
    { settlementId: 'ST-2025-11', from: '2025-11-17', to: '2025-11-23', total: 210200, fees: 4204, net: 205996, status: 'PAID' },
]

export const subMerchantsData = [
    { code: 'BR-01', name: 'Defence', status: 'Active', vol30: 520000, success: 98 },
    { code: 'BR-02', name: 'Clifton', status: 'Active', vol30: 410500, success: 97 },
    { code: 'BR-03', name: 'Saddar', status: 'Watch', vol30: 288900, success: 92 },
]

export let usersData = [
    { name: 'Merchant Admin', username: 'abc_admin', role: 'MERCHANT_ADMIN', status: 'Active' },
    { name: 'Branch-01 Operator', username: 'br01_operator', role: 'SHOP_OPERATOR', status: 'Active' },
    { name: 'Branch-03 Supervisor', username: 'br03_supervisor', role: 'SHOP_SUPERVISOR', status: 'Blocked' },
]

export let reportsData = [
    { name: 'Collections Summary', range: 'Last 7 days', created: 'Today', status: 'READY' },
    { name: 'Settlements Report', range: 'Last 30 days', created: 'Yesterday', status: 'READY' },
]

export const SHOP_OPTIONS = ['Branch-01', 'Branch-02', 'Branch-03']
export const COLLECTION_STATUS_OPTIONS = ['SUCCESS', 'PENDING', 'FAILED']
export const REFUND_STATUS_OPTIONS = ['REQUESTED', 'APPROVED', 'REJECTED']
export const SETTLEMENT_STATUS_OPTIONS = ['PENDING', 'PAID', 'FAILED']
export const USER_ROLE_OPTIONS = ['MERCHANT_ADMIN', 'SHOP_OPERATOR', 'SHOP_SUPERVISOR']
export const USER_STATUS_OPTIONS = ['Active', 'Blocked']
export const SUB_MERCHANT_STATUS_OPTIONS = ['Active', 'Blocked', 'Watch']
