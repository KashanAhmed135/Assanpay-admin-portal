import { Fragment } from 'react'
import { StatusBadge } from './StatusBadge'

const normalizeSelection = (selected) => {
    if (!selected) return new Set()
    if (selected instanceof Set) return selected
    if (Array.isArray(selected)) return new Set(selected)
    return new Set()
}

export function DataTable({
    columns,
    data,
    renderActions,
    keyField = 'id',
    selectable = false,
    selectedKeys,
    onToggleRow,
    onToggleAll,
    renderExpanded,
    expandedKeys,
    onToggleExpand,
    expandKeyField,
}) {
    const selected = normalizeSelection(selectedKeys)
    const allSelected = selectable && data.length > 0 && data.every((row) => selected.has(row[keyField]))
    const someSelected = selectable && data.some((row) => selected.has(row[keyField]))
    const expanded = normalizeSelection(expandedKeys)
    const hasExpansion = typeof renderExpanded === 'function'
    const effectiveExpandKey = expandKeyField || keyField
    const baseColCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0) + (hasExpansion ? 1 : 0)

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] theme-scrollbar">
            <table className="w-full text-left text-sm text-[var(--color-text-primary)]">
                <thead>
                    <tr className="border-b border-[var(--color-border-soft)] text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                        {hasExpansion && <th className="px-3 py-3 font-semibold w-10"></th>}
                        {selectable && (
                            <th className="px-4 py-3 font-semibold w-10">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-[var(--color-accent)]"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = !allSelected && someSelected
                                    }}
                                    onChange={(e) => onToggleAll && onToggleAll(e.target.checked)}
                                />
                            </th>
                        )}
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 font-semibold whitespace-nowrap ${col.className || ''}`}
                                style={col.align === 'right' ? { textAlign: 'right' } : {}}
                            >
                                {col.label}
                            </th>
                        ))}
                        {renderActions && <th className="px-4 py-3 text-right font-semibold">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-soft)]">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]"
                                colSpan={baseColCount}
                            >
                                No records
                            </td>
                        </tr>
                    ) : data.map((row) => {
                        const rowKey = row[effectiveExpandKey]
                        const isExpanded = hasExpansion && expanded.has(rowKey)
                        return (
                            <Fragment key={row[keyField]}>
                                <tr className="hover:bg-[var(--color-surface)]/50">
                                    {hasExpansion && (
                                        <td className="px-3 py-3 align-top">
                                            <button
                                                type="button"
                                                className="h-7 w-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                                onClick={() => onToggleExpand && onToggleExpand(rowKey)}
                                                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                            >
                                                {isExpanded ? '-' : '+'}
                                            </button>
                                        </td>
                                    )}
                                    {selectable && (
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--color-accent)]"
                                                checked={selected.has(row[keyField])}
                                                onChange={() => onToggleRow && onToggleRow(row[keyField])}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => {
                                        const rawValue = col.key === 'status'
                                            ? null
                                            : col.render
                                                ? col.render(row)
                                                : row[col.key]
                                        const isMultilineString = typeof rawValue === 'string' && rawValue.includes('\n')
                                        return (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3 ${isMultilineString ? 'whitespace-pre-line' : ''} ${col.cellClassName || ''}`}
                                                style={col.align === 'right' ? { textAlign: 'right' } : {}}
                                            >
                                                {col.key === 'status'
                                                    ? <StatusBadge value={row[col.key]} />
                                                    : rawValue}
                                            </td>
                                        )
                                    })}
                                    {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
                                </tr>
                                {hasExpansion && isExpanded && (
                                    <tr className="bg-[var(--color-surface)]/40">
                                        <td colSpan={baseColCount} className="px-4 pb-4 pt-2">
                                            {renderExpanded(row)}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
