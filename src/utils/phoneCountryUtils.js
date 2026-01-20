import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max'

export const ALL_COUNTRIES = getCountries()

export function getFilteredPhoneCountries(query) {
    const q = (query || '').trim().toLowerCase()
    const displayNames =
        typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

    const list = ALL_COUNTRIES.map((code) => ({
        code,
        name: displayNames ? displayNames.of(code) : code,
        dialCode: getCountryCallingCode(code),
    }))

    if (!q) return list

    return list.filter((country) => {
        return (
            country.name.toLowerCase().includes(q) ||
            country.code.toLowerCase().includes(q) ||
            country.dialCode.includes(q.replace('+', ''))
        )
    })
}
