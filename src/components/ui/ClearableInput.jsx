import { X } from 'lucide-react'

export function ClearableInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  type = 'text',
  inputClassName = '',
  clearButtonClassName = '',
  ...props
}) {
  const showClear = value && String(value).length > 0

  return (
    <div className={`relative ${className}`.trim()}>
      <input
        className={`pr-9 ${inputClassName}`.trim()}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Clear input"
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5aa7ff]/60 ${clearButtonClassName}`.trim()}
          onClick={() => onChange({ target: { value: '' } })}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
