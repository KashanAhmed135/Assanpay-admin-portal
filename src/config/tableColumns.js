import { fmtPKR } from '../utils/helpers'

export const COLLECTION_COLUMNS = [
    { key: 'time', label: 'Time' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'shop', label: 'Shop' },
    { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount) },
    { key: 'status', label: 'Status' },
    { key: 'providerRef', label: 'Provider Ref' },
]

export const COLLECTION_CSV_COLUMNS = [
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'shop', label: 'Shop' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'providerRef', label: 'Provider Ref' },
]

export const REFUND_COLUMNS = [
    { key: 'refundId', label: 'Refund ID' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'shop', label: 'Shop' },
    { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount) },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' },
]

export const REFUND_CSV_COLUMNS = [
    { key: 'date', label: 'Date' },
    { key: 'refundId', label: 'Refund ID' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'shop', label: 'Shop' },
    { key: 'amount', label: 'Amount' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' },
]

export const SETTLEMENT_COLUMNS = [
    { key: 'settlementId', label: 'Settlement ID' },
    { key: 'period', label: 'Period', render: (row) => `${row.from} – ${row.to}` },
    { key: 'total', label: 'Total Amount', render: (row) => fmtPKR(row.total) },
    { key: 'fees', label: 'Fees', render: (row) => fmtPKR(row.fees) },
    { key: 'net', label: 'Net Payout', render: (row) => fmtPKR(row.net) },
    { key: 'status', label: 'Status' },
]

export const SETTLEMENT_CSV_COLUMNS = [
    { key: 'settlementId', label: 'Settlement ID' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'total', label: 'Total' },
    { key: 'fees', label: 'Fees' },
    { key: 'net', label: 'Net' },
    { key: 'status', label: 'Status' },
]

export const SUB_MERCHANT_COLUMNS = [
    { key: 'code', label: 'Branch Code' },
    { key: 'name', label: 'Branch Name' },
    { key: 'status', label: 'Status' },
    { key: 'vol30', label: 'Collections (30d)', render: (row) => fmtPKR(row.vol30) },
    { key: 'success', label: 'Success Rate', render: (row) => `${row.success}%` },
]

export const USER_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
]

export const USER_CSV_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
]

export const REPORT_COLUMNS = [
    { key: 'name', label: 'Report' },
    { key: 'range', label: 'Range' },
    { key: 'created', label: 'Created' },
    { key: 'status', label: 'Status' },
]

export const REPORT_CSV_COLUMNS = [
    { key: 'report', label: 'Report' },
    { key: 'range', label: 'Range' },
    { key: 'created', label: 'Created' },
    { key: 'status', label: 'Status' },
]
