import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export const DEFAULT_PHONE_COUNTRY = 'PK'

export const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
export const NAME_PATTERN = "^[A-Za-z0-9][A-Za-z0-9 .,'&()\\-\\/]{1,78}$"
export const USERNAME_PATTERN = '^[A-Za-z0-9][A-Za-z0-9._@-]{2,59}$'
export const PASSWORD_PATTERN = '^(?=.*[A-Za-z])(?=.*\\d).{8,}$'
export const COMMISSION_PERCENT_PATTERN = '^(100(\\.0{1,2})?|\\d{1,2}(\\.\\d{1,2})?)$'
export const COMMISSION_AMOUNT_PATTERN = '^\\d{1,9}(\\.\\d{1,2})?$'
export const LIMIT_AMOUNT_PATTERN = '^(?:-1|\\d{1,12}(\\.\\d{1,2})?)$'

export const ALLOWED_PHONE_TYPES = new Set(['MOBILE', 'FIXED_LINE_OR_MOBILE'])

export function createMerchantId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function normalizePhoneDigits(value) {
    return (value || '').toString().replace(/\D/g, '')
}

export function validateEmail(value) {
    return new RegExp(EMAIL_PATTERN).test(value || '')
}

export function validatePhoneNumber(national, country) {
    if (!national) return 'Phone number is required.'
    const parsed = parsePhoneNumberFromString(national, country)
    if (!parsed) return 'Invalid phone number.'
    if (!parsed.isPossible()) return 'Phone number length is not valid for selected country.'
    if (!parsed.isValid()) return 'Invalid phone number for selected country.'
    const type = parsed.getType?.()
    if (type && !ALLOWED_PHONE_TYPES.has(type)) {
        return 'Only mobile numbers are allowed for this field.'
    }
    return ''
}

export function getPhoneDefaults(value) {
    if (!value) return { country: DEFAULT_PHONE_COUNTRY, national: '' }
    const parsed = parsePhoneNumberFromString(value.toString())
    if (parsed && parsed.country) {
        return { country: parsed.country, national: parsed.nationalNumber }
    }
    return { country: DEFAULT_PHONE_COUNTRY, national: normalizePhoneDigits(value) }
}

export function validateMerchantFormData(data, phoneError) {
    const errors = []

    if (phoneError) {
        errors.push(phoneError)
    }

    if (data.legal_email && !validateEmail(data.legal_email)) {
        errors.push('Please enter a valid legal email address.')
    }

    if (data.admin_email && !validateEmail(data.admin_email)) {
        errors.push('Please enter a valid admin email address.')
    }

    return errors
}

export function prepareMerchantData(formData, phoneNumber, editingMerchant) {
    return {
        ...formData,
        business_phone: phoneNumber ? phoneNumber.format('E.164') : '',
        id: editingMerchant ? editingMerchant.id : createMerchantId(),
        mid: editingMerchant ? editingMerchant.mid : createMerchantId(),
        createdAt: editingMerchant ? editingMerchant.createdAt : new Date().toISOString(),
        status: formData.status || 'active',
    }
}
