import { StatusBadge } from './StatusBadge'

export function DataTable({ columns, data, renderActions, keyField = 'id' }) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-left text-sm text-[#eaf1ff]">
                <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#a9b7d4]/70">
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap" style={col.align === 'right' ? { textAlign: 'right' } : {}}>{col.label}</th>
                        ))}
                        {renderActions && <th className="px-4 py-3 text-right font-semibold">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">{data.map((row) => (
                    <tr key={row[keyField]} className="transition hover:bg-white/[0.02]">
                        {columns.map((col) => (
                            <td key={col.key} className="px-4 py-3" style={col.align === 'right' ? { textAlign: 'right' } : {}}>
                                {col.key === 'status' ? <StatusBadge value={row[col.key]} /> : col.render ? col.render(row) : row[col.key]}
                            </td>
                        ))}
                        {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
                    </tr>
                ))}</tbody>
            </table>
        </div>
    )
}
