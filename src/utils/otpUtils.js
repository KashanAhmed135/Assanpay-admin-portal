export function generateOtp() {
    return String(Math.floor(10000 + Math.random() * 90000)) // 5 digits
}

export function formatCountdown(ms) {
    const totalSec = Math.ceil(ms / 1000)
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    return `${m}:${s}`
}
