export function toCSV(rows, headers) {
    const esc = (v) => {
        const s = String(v ?? '')
        return `"${s.replaceAll('"', '""')}"`
    }
    const head = headers.map((h) => esc(h.label)).join(',')
    const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(',')).join('\n')
    return head + '\n' + body
}

export function downloadCSV(filename, csvText) {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export function exportDataToCSV(data, columns, filename) {
    const csv = toCSV(data, columns)
    downloadCSV(filename, csv)
}
