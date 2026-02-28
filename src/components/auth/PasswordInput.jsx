import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput({
    id,
    label,
    value,
    onChange,
    onBlur,
    showPassword,
    onToggleShow,
    placeholder = '••••••••',
    helperText,
    error
}) {
    return (
        <div className="grid gap-1.5 sm:gap-2 md:gap-[6px]">
            <label htmlFor={id} className="text-xs sm:text-[13px] text-[var(--color-text-secondary)]/95">
                {label}
            </label>

            <div className="relative">
                <input
                    className="p-3 sm:p-[12px_14px] pr-12 rounded-[14px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/55 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] text-sm sm:text-base w-full"
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                />

                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {helperText && (
                <div className="text-[var(--color-text-secondary)]/80 text-[10px] sm:text-xs md:text-[12px]">{helperText}</div>
            )}

            {error && (
                <div className="text-[rgba(255,90,122,0.95)] text-[10px] sm:text-xs md:text-[12px]">{error}</div>
            )}
        </div>
    )
}
