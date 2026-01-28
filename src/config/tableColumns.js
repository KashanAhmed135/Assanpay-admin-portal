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

export const PAYMENT_COLUMNS = [
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'branchCode', label: 'Branch Code' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount) },
    { key: 'paymentMethod', label: 'Payment Method' },
]

export const REFUND_ADMIN_COLUMNS = [
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'refundAmount', label: 'Refund Amount', render: (row) => fmtPKR(row.refundAmount) },
    { key: 'refundType', label: 'Refund Type' },
    { key: 'reason', label: 'Reason', render: (row) => row.reason || '-' },
    { key: 'requestedBy', label: 'Requested By' },
    { key: 'status', label: 'Status' },
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

export const AUDIT_LOG_COLUMNS = [
    { key: 'entityType', label: 'Entity Type' },
    { key: 'action', label: 'Action' },
    { key: 'performedBy', label: 'Performed By' },
    { key: 'message', label: 'Message', render: (row) => row.message || '-' },
    { key: 'createdAt', label: 'Time' },
]

export const AUDIT_LOG_CSV_COLUMNS = [
    { key: 'entityType', label: 'Entity Type' },
    { key: 'action', label: 'Action' },
    { key: 'performedBy', label: 'Performed By' },
    { key: 'message', label: 'Message' },
    { key: 'createdAt', label: 'Time' },
]

export const LIMIT_POLICY_COLUMNS = [
    { key: 'merchant', label: 'Merchant' },
    { key: 'provider', label: 'Provider' },
    { key: 'period', label: 'Period' },
    { key: 'maxAmount', label: 'Max Amount', render: (row) => fmtPKR(row.maxAmount) },
    { key: 'maxTxn', label: 'Max Txn' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'weekStart', label: 'Week Start' },
    { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
]

export const PAYMENT_METHOD_COLUMNS = [
    { key: 'srNo', label: 'SR NO.' },
    { key: 'merchantOf', label: 'Merchant Of' },
    { key: 'username', label: 'Username' },
    { key: 'storeId', label: 'Store ID' },
    { key: 'ewp', label: 'EWP' },
    { key: 'credentials', label: 'Credentials' },
]

export const SETTLEMENT_REPORT_COLUMNS = [
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'settlementDate', label: 'Settlement Date' },
    { key: 'transCount', label: 'Trans Count' },
    { key: 'transAmount', label: 'Trans Amount', render: (row) => fmtPKR(row.transAmount || 0) },
    { key: 'otpDeduction', label: 'OTP Deduction', render: (row) => fmtPKR(row.otpDeduction || 0) },
    { key: 'commission', label: 'Commission', render: (row) => fmtPKR(row.commission || 0) },
    { key: 'commissionPct', label: 'Commission %', render: (row) => (row.commissionPct ? `${row.commissionPct}%` : '-') },
    { key: 'gst', label: 'GST', render: (row) => fmtPKR(row.gst || 0) },
    { key: 'withholdingTax', label: 'Withholding Tax', render: (row) => fmtPKR(row.withholdingTax || 0) },
    { key: 'merchantAmount', label: 'Merchant Amount', render: (row) => fmtPKR(row.merchantAmount || 0) },
]

export const SUB_MERCHANT_ADMIN_COLUMNS = [
    { key: 'branchCode', label: 'Branch Code' },
    { key: 'branchName', label: 'Branch Name' },
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
]

export const USERS_ADMIN_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
]

export const INQUIRIES_ADMIN_COLUMNS = [
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
]
