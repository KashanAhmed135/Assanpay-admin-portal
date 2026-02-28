import { useEffect, useMemo, useState } from 'react'
import { formatCountdown } from '../utils/otpUtils'

export function useOtpTimer(initialEmail = '') {
    const [otpState, setOtpState] = useState({
        email: initialEmail,
        expiresAt: null,
        resendAt: null,
    })
    const [now, setNow] = useState(Date.now())

    // Timer tick for countdown
    useEffect(() => {
        if (!otpState.expiresAt && !otpState.resendAt) return
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [otpState.expiresAt, otpState.resendAt])

    const remainingMs = useMemo(() => {
        if (!otpState.expiresAt) return 0
        return Math.max(0, otpState.expiresAt - now)
    }, [otpState.expiresAt, now])

    const resendRemainingMs = useMemo(() => {
        if (!otpState.resendAt) return 0
        return Math.max(0, otpState.resendAt - now)
    }, [otpState.resendAt, now])

    const isOtpActive = !!otpState.expiresAt && remainingMs > 0
    const isOtpExpired = !!otpState.expiresAt && remainingMs <= 0
    const canRequestNewOtp = resendRemainingMs <= 0
    const countdownText = otpState.resendAt ? formatCountdown(resendRemainingMs) : '00:00'

    const startOtp = (email, expiresInSec = 300, resendInSec = 60) => {
        const nowMs = Date.now()
        setOtpState({
            email,
            expiresAt: nowMs + expiresInSec * 1000,
            resendAt: nowMs + resendInSec * 1000,
        })
    }

    const resendOtp = () => {
        if (!canRequestNewOtp || !otpState.email) return false
        return true
    }

    const clearOtp = () => {
        setOtpState({ email: null, expiresAt: null, resendAt: null })
    }

    return {
        otpState,
        isOtpActive,
        isOtpExpired,
        canRequestNewOtp,
        countdownText,
        remainingMs,
        startOtp,
        resendOtp,
        clearOtp,
    }
}
