import { useEffect, useMemo, useState } from 'react'
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { DEFAULT_PHONE_COUNTRY, getPhoneDefaults, validatePhoneNumber } from '../utils/merchantValidation'
import { ALL_COUNTRIES } from '../utils/phoneCountryUtils'

export function usePhoneInput(initialPhone = '') {
    const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY)
    const [phoneNational, setPhoneNational] = useState('')
    const [phoneCountryOpen, setPhoneCountryOpen] = useState(false)
    const [phoneCountryQuery, setPhoneCountryQuery] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [phoneTouched, setPhoneTouched] = useState(false)

    const selectedPhoneCountry = useMemo(() => {
        if (ALL_COUNTRIES.includes(phoneCountry)) return phoneCountry
        return DEFAULT_PHONE_COUNTRY
    }, [phoneCountry])

    // Initialize phone from value
    useEffect(() => {
        const defaults = getPhoneDefaults(initialPhone)
        setPhoneCountry(defaults.country)
        setPhoneNational(defaults.national)
        const initialError = defaults.national ? validatePhoneNumber(defaults.national, defaults.country) : ''
        setPhoneError(initialError)
        setPhoneTouched(Boolean(defaults.national))
    }, [initialPhone])

    // Validate on change
    useEffect(() => {
        if (!phoneTouched) return
        setPhoneError(validatePhoneNumber(phoneNational, selectedPhoneCountry))
    }, [phoneNational, phoneTouched, selectedPhoneCountry])

    const getPhoneNumber = () => {
        if (!phoneNational || phoneError) return null
        return parsePhoneNumberFromString(phoneNational, selectedPhoneCountry)
    }

    return {
        phoneCountry,
        phoneNational,
        phoneCountryOpen,
        phoneCountryQuery,
        phoneError,
        phoneTouched,
        selectedPhoneCountry,
        setPhoneCountry,
        setPhoneNational,
        setPhoneCountryOpen,
        setPhoneCountryQuery,
        setPhoneError,
        setPhoneTouched,
        getPhoneNumber,
    }
}
