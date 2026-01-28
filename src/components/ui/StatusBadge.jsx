export function StatusBadge({ value, status: statusProp }) {
    const val = value || statusProp || ''
    const status = val.toUpperCase()
    let styles = 'bg-white/[0.04] text-[#a9b7d4] border-white/10'

    const good = 'bg-[rgba(47,208,122,0.12)] text-[#2fd07a] border-[rgba(47,208,122,0.25)]'
    const warn = 'bg-[rgba(255,204,102,0.12)] text-[#ffcc66] border-[rgba(255,204,102,0.25)]'
    const bad = 'bg-[rgba(255,90,122,0.12)] text-[#ff5a7a] border-[rgba(255,90,122,0.25)]'

    const okList = ['SUCCESS', 'PAID', 'READY', 'APPROVED', 'ACTIVE', 'COMPLETED', 'GOOD']
    const warnList = ['PENDING', 'REQUESTED', 'WATCH', 'PROCESSING', 'REVIEW', 'WARN']
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
