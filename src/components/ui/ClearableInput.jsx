import { X } from 'lucide-react'

export function ClearableInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  type = 'text',
  autoComplete,
  inputClassName = '',
  clearButtonClassName = '',
  ...props
}) {
  const showClear = value && String(value).length > 0
  const resolvedAutoComplete = autoComplete ?? (type === 'password' ? 'new-password' : 'off')

  return (
    <div className={`relative ${className}`.trim()}>
      <input
        className={`pr-9 ${inputClassName}`.trim()}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={resolvedAutoComplete}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Clear input"
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${clearButtonClassName}`.trim()}
          onClick={() => onChange({ target: { value: '' } })}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
