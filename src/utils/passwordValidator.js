export function passwordRules(pw) {
    return {
        length: pw.length >= 8,
        lower: /[a-z]/.test(pw),
        upper: /[A-Z]/.test(pw),
        number: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    }
}

export function passwordScore(pw) {
    const r = passwordRules(pw)
    const checks = Object.values(r).filter(Boolean).length
    if (!pw) return 0
    if (checks <= 2) return 1
    if (checks === 3) return 2
    if (checks === 4) return 3
    return 4
}

export function strengthLabel(score) {
    if (score <= 1) return 'Weak'
    if (score === 2) return 'Medium'
    if (score === 3) return 'Strong'
    return 'Very strong'
}

export function getStrengthColor(score) {
    if (score <= 1) return 'bg-[rgba(255,90,122,0.8)]'
    if (score === 2) return 'bg-[rgba(255,204,102,0.9)]'
    return 'bg-[rgba(47,208,122,0.9)]'
}

export function getStrengthTextColor(score) {
    if (score <= 1) return 'text-[rgba(255,90,122,0.95)]'
    if (score === 2) return 'text-[rgba(255,204,102,0.95)]'
    return 'text-[rgba(47,208,122,0.95)]'
}

export function isStrongPassword(pw) {
    const rules = passwordRules(pw)
    return rules.length && rules.lower && rules.upper && rules.number && rules.special
}
