import { useEffect, useMemo, useState } from 'react'
import { generateOtp, formatCountdown } from '../utils/otpUtils'

export function useOtpTimer(initialEmail = '') {
    const [otpState, setOtpState] = useState({ otp: null, email: initialEmail, expiresAt: null })
    const [now, setNow] = useState(Date.now())

    // Timer tick for countdown
    useEffect(() => {
        if (!otpState.expiresAt) return
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [otpState.expiresAt])

    const remainingMs = useMemo(() => {
        if (!otpState.expiresAt) return 0
        return Math.max(0, otpState.expiresAt - now)
    }, [otpState.expiresAt, now])

    const isOtpActive = !!otpState.otp && !!otpState.expiresAt && remainingMs > 0
    const isOtpExpired = !!otpState.expiresAt && remainingMs <= 0
    const canRequestNewOtp = !isOtpActive
    const countdownText = otpState.expiresAt ? formatCountdown(remainingMs) : '00:00'

    const sendOtp = (email) => {
        const otp = generateOtp()
        setOtpState({ otp, email, expiresAt: Date.now() + 60 * 1000 })
        return otp
    }

    const resendOtp = () => {
        if (!canRequestNewOtp || !otpState.email) return null
        return sendOtp(otpState.email)
    }

    const verifyOtp = (enteredOtp) => {
        if (!otpState.otp || !otpState.email) return { success: false, error: 'OTP not issued' }
        if (Date.now() > otpState.expiresAt) return { success: false, error: 'OTP expired' }
        if (!/^\d{5}$/.test(enteredOtp)) return { success: false, error: 'OTP must be exactly 5 digits' }
        if (enteredOtp !== otpState.otp) return { success: false, error: 'Invalid OTP' }

        // Clear OTP after successful verification
        setOtpState((s) => ({ ...s, otp: null, expiresAt: null }))
        return { success: true, email: otpState.email }
    }

    const clearOtp = () => {
        setOtpState({ otp: null, email: null, expiresAt: null })
    }

    return {
        otpState,
        isOtpActive,
        isOtpExpired,
        canRequestNewOtp,
        countdownText,
        remainingMs,
        sendOtp,
        resendOtp,
        verifyOtp,
        clearOtp,
    }
}
