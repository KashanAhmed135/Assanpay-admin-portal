import { StatusBadge } from '../ui/StatusBadge'

export function DetailView({ detailContent, detailTab, setDetailTab, onBack, onPrimaryAction, detailState }) {
    return (
        <div className="w-full space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 shadow-xl text-[#eaf1ff]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-[#eaf1ff]" id="detailTitle">
                            {detailContent.title}
                        </h3>
                        <p className="text-sm text-[#a9b7d4]/70" id="detailSub">
                            {detailContent.sub}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                            type="button"
                            onClick={onBack}
                        >
                            ← Back
                        </button>
                        <button
                            className="h-10 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-sm font-medium text-[#eaf1ff]"
                            type="button"
                            onClick={onPrimaryAction}
                        >
                            {detailContent.primaryText}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 gap-1 mb-6 overflow-x-auto pb-px" id="detailTabs">
                    {['overview', 'timeline', 'notes', 'actions', 'raw'].map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${detailTab === tab
                                ? 'text-[#5aa7ff]'
                                : 'text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.04]'
                                } rounded-t-lg`}
                            type="button"
                            onClick={() => setDetailTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {detailTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5aa7ff]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    {/* Overview Panel */}
                    {detailTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="panel-overview">
                            {detailContent.overviewPairs.map(([k, v]) => (
                                <div key={k + String(v)} className="space-y-1">
                                    <div className="text-[11px] uppercase tracking-wider text-[#a9b7d4]/60 font-medium">{k}</div>
                                    <div className="text-sm text-[#eaf1ff]">
                                        {k === 'Status' ? <StatusBadge value={v} /> : v}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Timeline Panel */}
                    {detailTab === 'timeline' && (
                        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20" id="panel-timeline">
                            <table className="w-full text-left text-sm text-[#eaf1ff]">
                                <thead>
                                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#a9b7d4]/70">
                                        <th className="px-4 py-3 font-semibold">Time</th>
                                        <th className="px-4 py-3 font-semibold">Event</th>
                                        <th className="px-4 py-3 font-semibold">Actor</th>
                                        <th className="px-4 py-3 font-semibold">Remark</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10" id="detailTimeline">
                                    {detailContent.timelineItems.map((x) => (
                                        <tr key={x.time + x.event} className="transition hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 whitespace-nowrap">{x.time}</td>
                                            <td className="px-4 py-3 font-medium">{x.event}</td>
                                            <td className="px-4 py-3">{x.actor}</td>
                                            <td className="px-4 py-3 text-[#a9b7d4]">{x.remark}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Notes Panel */}
                    {detailTab === 'notes' && (
                        <div className="space-y-4" id="panel-notes">
                            <div className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] p-3 rounded-xl border border-white/10">
                                Notes (UI demo): store in DB later (merchant_id scoped).
                            </div>
                            <textarea
                                className="w-full h-32 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50 placeholder:text-[#a9b7d4]/30"
                                id="detailNotes"
                                placeholder="Write internal notes..."
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                                    type="button"
                                    onClick={() => {
                                        const el = document.getElementById('detailNotes')
                                        if (el) el.value = ''
                                    }}
                                >
                                    Clear
                                </button>
                                <button
                                    className="h-10 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-sm font-medium text-[#eaf1ff]"
                                    type="button"
                                    onClick={() => {
                                        alert('Note saved (UI demo). Save in DB later.')
                                    }}
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions Panel */}
                    {detailTab === 'actions' && (
                        <div className="space-y-6" id="panel-actions">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="h-11 px-6 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-sm font-semibold text-[#eaf1ff]"
                                    type="button"
                                    onClick={() => alert('Approve (UI demo). Add RBAC + API later.')}
                                >
                                    Approve
                                </button>
                                <button
                                    className="h-11 px-6 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm font-semibold text-[#eaf1ff]"
                                    type="button"
                                    onClick={() => alert('Download (UI demo). Generate PDF/CSV later.')}
                                >
                                    Download
                                </button>
                                <button
                                    className="h-11 px-6 rounded-xl border border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.18)] hover:bg-[rgba(255,90,122,0.25)] transition text-sm font-semibold text-[#ff5a7a]"
                                    type="button"
                                    onClick={() => alert('Block/Disable (UI demo). Add confirm modal later.')}
                                >
                                    Block / Disable
                                </button>
                            </div>
                            <div className="text-[11px] text-[#a9b7d4]/60">
                                These actions are UI-only now. Later connect API + RBAC permissions.
                            </div>
                        </div>
                    )}

                    {/* Raw Panel */}
                    {detailTab === 'raw' && (
                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] overflow-auto max-h-[400px]" id="panel-raw">
                            <pre className="text-[#a9b7d4]">
                                {detailState.record ? JSON.stringify(detailState.record, null, 2) : ''}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
