export function withinDate(rowDate, from, to) {
    if (!from && !to) return true
    const d = new Date(rowDate)
    if (from) {
        const f = new Date(from)
        if (d < f) return false
    }
    if (to) {
        const t = new Date(to)
        t.setHours(23, 59, 59, 999)
        if (d > t) return false
    }
    return true
}

export function fmtPKR(n) {
    return '₨ ' + Number(n).toLocaleString()
}
