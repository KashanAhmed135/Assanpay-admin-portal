const normalizeValue = (value) => {
    if (value === null || value === undefined) return ''
    return value
}

export function buildExportPayload(rows, columns, { groupByKey } = {}) {
    const data = Array.isArray(rows) ? rows : []
    const baseColumns = Array.isArray(columns) ? columns : []
    const withNumberColumn = [
        { key: 'rowNo', label: '#' },
        ...baseColumns,
    ]

    const groupKey = groupByKey && baseColumns.some((col) => col.key === groupByKey)
        ? groupByKey
        : null

    if (!groupKey) {
        const numbered = data.map((row, idx) => ({
            ...row,
            rowNo: idx + 1,
        }))
        return { rows: numbered, columns: withNumberColumn }
    }

    const grouped = new Map()
    data.forEach((row) => {
        const key = row?.[groupKey] ?? 'Unknown'
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(row)
    })

    let counter = 1
    const groupedRows = []
    const firstDataKey = baseColumns[0]?.key || groupKey
    grouped.forEach((groupRows, key) => {
        groupedRows.push({
            rowNo: '',
            [firstDataKey]: `Merchant: ${normalizeValue(key)}`,
        })
        groupRows.forEach((row) => {
            groupedRows.push({
                ...row,
                rowNo: counter++,
            })
        })
        groupedRows.push({
            rowNo: '',
            [firstDataKey]: '',
        })
    })

    return { rows: groupedRows, columns: withNumberColumn }
}

