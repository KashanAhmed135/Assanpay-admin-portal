import { fmtPKR } from '../utils/helpers'
import { getPaymentMethodLogo } from '../utils/paymentLogos'

const renderRiskBadge = (value) => {
    const level = String(value || '').toUpperCase()
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide'
    if (level === 'HIGH') return <span className={`${base} bg-red-500/20 text-red-200`}>HIGH</span>
    if (level === 'MEDIUM' || level === 'MED') return <span className={`${base} bg-amber-500/20 text-amber-200`}>MEDIUM</span>
    if (level === 'LOW') return <span className={`${base} bg-emerald-500/20 text-emerald-200`}>LOW</span>
    return <span className={`${base} bg-white/10 text-white/70`}>{level || '-'}</span>
}

const renderPaymentMethod = (name) => {
    const label = name || '-'
    const logo = getPaymentMethodLogo(label)
    const initials = String(label).trim().slice(0, 2).toUpperCase()
    return (
        <div className="flex flex-col items-center gap-1">
            {logo ? (
                <img
                    src={logo}
                    alt={`${label} logo`}
                    className="h-6 w-6 rounded-full bg-white object-contain p-1"
                    loading="lazy"
                />
            ) : (
                <span className="h-6 w-6 rounded-full bg-white/10 text-[10px] text-[var(--color-text-primary)] grid place-items-center">
                    {initials}
                </span>
            )}
            <span className="text-xs">{label}</span>
        </div>
    )
}

export const COLLECTION_COLUMNS = [
    { key: 'time', label: 'Time' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'shop', label: 'Shop' },
    { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount) },
    {
        key: 'paymentMethod',
        label: 'Payment Method',
        className: 'text-center',
        cellClassName: 'text-center',
        render: (row) => renderPaymentMethod(row.paymentMethod),
    },
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
    {
        key: 'paymentMethod',
        label: 'Payment Method',
        className: 'text-center',
        cellClassName: 'text-center',
        render: (row) => renderPaymentMethod(row.paymentMethod),
    },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
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
    { key: 'total', label: 'Gross', render: (row) => fmtPKR(row.total ?? row.grossAmount ?? 0) },
    { key: 'fees', label: 'Fees', render: (row) => fmtPKR(row.fees ?? row.commissionAmount ?? 0) },
    { key: 'net', label: 'Net', render: (row) => fmtPKR(row.net ?? row.netAmount ?? 0) },
    { key: 'settledAmount', label: 'Settled', render: (row) => fmtPKR(row.settledAmount ?? 0) },
    { key: 'adjustmentsApplied', label: 'Adjustments', render: (row) => fmtPKR(row.adjustmentsApplied ?? 0) },
    { key: 'payoutAmount', label: 'Payout', render: (row) => fmtPKR(row.payoutAmount ?? 0) },
    { key: 'endingBalance', label: 'Ending Balance', render: (row) => fmtPKR(row.endingBalance ?? 0) },
    { key: 'status', label: 'Status' },
]

export const SETTLEMENT_CSV_COLUMNS = [
    { key: 'settlementId', label: 'Settlement ID' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'total', label: 'Gross' },
    { key: 'fees', label: 'Fees' },
    { key: 'net', label: 'Net' },
    { key: 'settledAmount', label: 'Settled' },
    { key: 'adjustmentsApplied', label: 'Adjustments' },
    { key: 'payoutAmount', label: 'Payout' },
    { key: 'endingBalance', label: 'Ending Balance' },
    { key: 'status', label: 'Status' },
]

export const WEBHOOK_OUTBOX_COLUMNS = [
    { key: 'eventId', label: 'Event ID' },
    { key: 'status', label: 'Status' },
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'attempts', label: 'Attempts' },
    { key: 'nextRetryAt', label: 'Next Retry' },
    { key: 'createdAt', label: 'Created' },
]

export const RISK_DASHBOARD_COLUMNS = [
    { key: 'merchantName', label: 'Merchant' },
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'successVolume', label: 'Success Volume', render: (row) => fmtPKR(row.successVolume ?? 0) },
    { key: 'refundRate', label: 'Refund Rate', render: (row) => `${((row.refundRate ?? 0) * 100).toFixed(2)}%` },
    { key: 'chargebackRate', label: 'Chargeback Rate', render: (row) => `${((row.chargebackRate ?? 0) * 100).toFixed(2)}%` },
    { key: 'currentBalance', label: 'Balance', render: (row) => fmtPKR(row.currentBalance ?? 0) },
    {
        key: 'autoRiskLevel',
        label: 'Auto Level',
        render: (row) => renderRiskBadge(row.autoRiskLevel),
    },
    {
        key: 'finalRiskLevel',
        label: 'Final Level',
        render: (row) => renderRiskBadge(row.finalRiskLevel),
    },
    { key: 'finalReservePercent', label: 'Reserve %', render: (row) => `${row.finalReservePercent ?? 0}%` },
    {
        key: 'payoutFreeze',
        label: 'Payout Freeze',
        render: (row) => (
            <div className="space-y-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide ${row.payoutFreeze ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
                    {row.payoutFreeze ? 'Frozen' : 'Active'}
                </span>
                {row.payoutFreeze && row.payoutFreezeReason && (
                    <div className="text-[10px] text-[var(--color-text-secondary)]/80 max-w-[200px] break-words">
                        {row.payoutFreezeReason}
                    </div>
                )}
            </div>
        ),
    },
    { key: 'calculatedAt', label: 'Calculated At' },
]
export const SUB_MERCHANT_COLUMNS = [
    { key: 'code', label: 'Branch Code' },
    { key: 'name', label: 'Branch Name' },
    {
        key: 'status',
        label: 'Status',
        render: (row) => {
            if (row.adminBlocked) return 'Admin Blocked'
            if (row.adminApproved === false) return 'Awaiting Approval'
            return row.blocked ? 'Blocked' : 'Active'
        },
    },
    { key: 'vol30', label: 'Collections (30d)', render: (row) => fmtPKR(row.vol30) },
    { key: 'success', label: 'Success Rate', render: (row) => `${row.success}%` },
]

export const USER_COLUMNS = [
    { key: 'branch', label: 'Branch' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
]

export const USER_CSV_COLUMNS = [
    { key: 'branch', label: 'Branch' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
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
  { key: 'performedByUsername', label: 'Performed By' },
  { key: 'performedByStatus', label: 'User Status' },
  {
    key: 'message',
    label: 'Message',
    className: 'w-[320px] whitespace-normal',
    cellClassName: 'max-w-[320px] min-w-0 break-words whitespace-normal',
    render: (row) => (
        <div className="max-w-[320px] break-words whitespace-normal">
            {row.message || '-'}
        </div>
    ),
  },
  { key: 'createdAt', label: 'Time' },
]

export const AUDIT_LOG_CSV_COLUMNS = [
  { key: 'entityType', label: 'Entity Type' },
  { key: 'action', label: 'Action' },
  { key: 'performedByUsername', label: 'Performed By' },
  { key: 'performedByStatus', label: 'User Status' },
  { key: 'message', label: 'Message' },
  { key: 'createdAt', label: 'Time' },
]

export const LIMIT_POLICY_COLUMNS = [
    { key: 'merchantName', label: 'Merchant' },
    {
        key: 'paymentMethodName',
        label: 'Payment Method',
        className: 'text-center',
        cellClassName: 'text-center',
        render: (row) => renderPaymentMethod(row.paymentMethodName),
    },
    {
        key: 'dailyLimit',
        label: 'Daily Limit',
        render: (row) => {
            const limit = row.dailyLimit != null ? fmtPKR(row.dailyLimit) : '-'
            const dailyUsed = row.dailyUsed != null ? fmtPKR(row.dailyUsed) : '-'
            const monthlyUsed = row.monthlyUsed != null ? fmtPKR(row.monthlyUsed) : '-'
            return `
${limit}
Used: ${dailyUsed}
MTD: ${monthlyUsed}
            `.trim()
        },
    },
    { key: 'perTransactionLimit', label: 'Per Txn Limit', render: (row) => (row.perTransactionLimit != null ? fmtPKR(row.perTransactionLimit) : '-') },
    { key: 'minSingleAmount', label: 'Min Amount', render: (row) => (row.minSingleAmount != null ? fmtPKR(row.minSingleAmount) : '-') },
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

export const SETTLEMENT_SUMMARY_COLUMNS = [
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'merchantEmail', label: 'Legal Email' },
    { key: 'totalSettlements', label: 'Total Settlements' },
    { key: 'totalSettledAmount', label: 'Total Settled Amount', render: (row) => fmtPKR(row.totalSettledAmount || 0) },
    { key: 'dueAmount', label: 'Due Amount', render: (row) => fmtPKR(row.dueAmount || 0) },
    { key: 'status', label: 'Settlement Status' },
]

export const SUB_MERCHANT_ADMIN_COLUMNS = [
    { key: 'branchCode', label: 'Branch Code' },
    { key: 'branchName', label: 'Branch Name' },
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'userEmail', label: 'User Email' },
    {
        key: 'status',
        label: 'Status',
        render: (row) => {
            if (row.adminBlocked) return 'Admin Blocked'
            if (row.adminApproved === false) return 'Awaiting Approval'
            return row.blocked ? 'Blocked' : 'Active'
        },
    },
    { key: 'createdAt', label: 'Created At' },
]

export const USERS_ADMIN_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
]

export const INQUIRIES_ADMIN_COLUMNS = [
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'merchantName', label: 'Merchant Name' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
]


