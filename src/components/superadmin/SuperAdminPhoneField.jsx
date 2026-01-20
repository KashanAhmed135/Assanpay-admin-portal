import { getCountryCallingCode } from 'libphonenumber-js/max'

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function PhoneField({
  selectedPhoneCountry,
  phoneCountryOpen,
  phoneCountryQuery,
  filteredPhoneCountries,
  phoneError,
  phoneNational,
  onToggleCountry,
  onSearchCountry,
  onSelectCountry,
  onPhoneChange,
  onPhoneBlur,
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm text-[#a9b7d4]/90">Business Phone *</label>
      <div className="flex gap-2">
        <div className="relative min-w-[120px]">
          <button
            type="button"
            className={`h-11 w-full px-2 rounded-xl border ${phoneError ? 'border-[#ff5a7a]' : 'border-white/10'
              } bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff] flex items-center justify-between gap-2`}
            onClick={onToggleCountry}
            aria-haspopup="listbox"
            aria-expanded={phoneCountryOpen}
          >
            <span className="flex items-center gap-2 text-sm">
              <span>{getFlagEmoji(selectedPhoneCountry)}</span>
              <span>+{getCountryCallingCode(selectedPhoneCountry)}</span>
            </span>
            <span className="text-xs opacity-70">v</span>
          </button>
          {phoneCountryOpen && (
            <div className="absolute z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b1220] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
              <div className="p-2 border-b border-white/10">
                <input
                  id="phoneCountrySearch"
                  name="phoneCountrySearch"
                  className="h-9 w-full px-2 rounded-lg border border-white/10 bg-black/20 outline-none text-sm placeholder:text-[#a9b7d4]/55"
                  placeholder="Search country or code..."
                  value={phoneCountryQuery}
                  onChange={(e) => onSearchCountry(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPhoneCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition flex items-center gap-2"
                    onClick={() => onSelectCountry(country.code)}
                  >
                    <span>{getFlagEmoji(country.code)}</span>
                    <span className="flex-1">{country.name}</span>
                    <span>+{country.dialCode}</span>
                  </button>
                ))}
                {filteredPhoneCountries.length === 0 && (
                  <div className="px-3 py-2 text-xs text-[#a9b7d4]/70">No matches</div>
                )}
              </div>
            </div>
          )}
        </div>
        <input
          className={`h-11 px-3 rounded-xl border ${phoneError ? 'border-[#ff5a7a]' : 'border-white/10'
            } bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff] flex-1 placeholder:text-[#a9b7d4]/60`}
          name="business_phone_local"
          type="tel"
          inputMode="numeric"
          value={phoneNational}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={onPhoneBlur}
          placeholder="3000000000"
          maxLength={15}
          pattern="^[0-9]{4,15}$"
          title="Digits only, 4-15 characters"
          required
        />
      </div>
      {phoneError ? (
        <div className="text-[11px] text-[#ff5a7a]">{phoneError}</div>
      ) : (
        <div className="text-[11px] text-[#a9b7d4]/70">Enter national number only. Length follows selected country.</div>
      )}
    </div>
  )
}
