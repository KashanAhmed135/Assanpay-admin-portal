export function Card({ title, right, children, className, bodyClassName }) {
    return (
        <article className={`card-surface rounded-2xl border border-[var(--color-border-soft)] overflow-hidden w-full ${className || ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-[var(--color-border-soft)]">
                <h3 className="text-sm sm:text-[15px] font-semibold text-[var(--color-text-primary)] min-w-0 break-words">
                    {title}
                </h3>
                {right ? <div className="flex-shrink-0">{right}</div> : null}
            </div>
            <div className={`p-4 sm:p-5 ${bodyClassName || ''}`}>{children}</div>
        </article>
    )
}

export function Pill({ tone = 'neutral', children }) {
    const cls =
        tone === 'good'
            ? 'border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
            : tone === 'warn'
                ? 'border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
                : tone === 'bad'
                    ? 'border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                    : 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'

    return (
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] ${cls}`}>
            {children}
        </span>
    )
}
