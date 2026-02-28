export function StatusBadge({ value, status: statusProp }) {
    const val = value || statusProp || ''
    const status = val.toUpperCase()
    let styles = 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-[var(--color-border-soft)]'

    const good = 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_35%,transparent)]'
    const warn = 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)]'
    const bad = 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)]'

    const okList = ['SUCCESS', 'PAID', 'READY', 'APPROVED', 'ACTIVE', 'COMPLETED', 'GOOD']
    const warnList = ['PENDING', 'REQUESTED', 'WATCH', 'PROCESSING', 'REVIEW', 'WARN', 'PAUSED']
    const badList = ['FAILED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'ERROR', 'RISK', 'BAD']

    if (okList.includes(status)) styles = good
    else if (warnList.includes(status)) styles = warn
    else if (badList.includes(status)) styles = bad

    return (
        <span className={`inline-flex items-center min-w-[92px] justify-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${styles}`}>
            {val || 'Unknown'}
        </span>
    )
}
