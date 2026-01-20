export function Card({ title, right, children }) {
    return (
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden w-full">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10">
                <h3 className="text-sm sm:text-[15px] font-semibold text-[#eaf1ff]">{title}</h3>
                {right}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </article>
    )
}

export function Pill({ tone = 'neutral', children }) {
    const cls =
        tone === 'good'
            ? 'border-[rgba(47,208,122,0.35)] bg-[rgba(47,208,122,0.10)] text-[rgba(47,208,122,0.95)]'
            : tone === 'warn'
                ? 'border-[rgba(255,204,102,0.35)] bg-[rgba(255,204,102,0.10)] text-[rgba(255,204,102,0.95)]'
                : tone === 'bad'
                    ? 'border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.10)] text-[rgba(255,90,122,0.95)]'
                    : 'border-white/12 bg-black/20 text-[#a9b7d4]/90'

    return (
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] ${cls}`}>
            {children}
        </span>
    )
}
