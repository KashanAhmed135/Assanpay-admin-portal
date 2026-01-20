export const MOCK_USERS = [
    { email: 'admin@assanpay.com', password: 'Admin@123', role: 'SUPER_ADMIN' },
    { email: 'merchant@shop.com', password: 'Merchant@123', role: 'MERCHANT' },
]

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/

export function findUser(email, password) {
    return MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
}

export function updateUserPassword(email, newPassword) {
    const idx = MOCK_USERS.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
    if (idx !== -1) {
        MOCK_USERS[idx] = { ...MOCK_USERS[idx], password: newPassword }
        return true
    }
    return false
}
