export function MessageBox({ message, type }) {
    if (!message) return null

    return (
        <div
            className={`mt-1 sm:mt-2 md:mt-1 p-2.5 sm:p-3 md:p-[10px_12px] rounded-[14px] border text-xs sm:text-[13px] ${type === 'ok'
                    ? 'border-[rgba(47,208,122,0.35)] bg-[rgba(47,208,122,0.08)] text-[rgba(47,208,122,0.95)]'
                    : 'border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.08)] text-[rgba(255,90,122,0.95)]'
                }`}
        >
            {message}
        </div>
    )
}
