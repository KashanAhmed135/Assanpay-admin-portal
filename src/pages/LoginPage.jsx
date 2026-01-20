import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageBox } from '../components/auth/MessageBox'
import { PasswordInput } from '../components/auth/PasswordInput'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
import { useOtpTimer } from '../hooks/useOtpTimer'
import { findUser, updateUserPassword, EMAIL_REGEX } from '../data/mockUsers'
import { isStrongPassword } from '../utils/passwordValidator'

export function LoginPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('login') // login | forgot | otp | reset

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')

  // OTP state
  const [otpValue, setOtpValue] = useState('')
  const otpTimer = useOtpTimer()

  // Reset password state
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Message state
  const [msg, setMsg] = useState({ target: null, type: '', text: '' })

  const showMsg = (target, text, type) => setMsg({ target, text, type })
  const clearMsg = (target) => setMsg((m) => (m.target === target ? { target: null, text: '', type: '' } : m))

  // Login handler
  const handleLoginSubmit = (e) => {
    e.preventDefault()
    clearMsg('login')

    const email = loginEmail.trim().toLowerCase()
    const pw = loginPassword

    if (!EMAIL_REGEX.test(email)) {
      showMsg('login', 'Please enter a valid email (e.g., name@domain.com).', 'err')
      return
    }

    if (pw.length < 8) {
      showMsg('login', 'Password must be at least 8 characters.', 'err')
      return
    }

    const user = findUser(email, pw)
    if (!user) {
      showMsg('login', 'Invalid email or password.', 'err')
      return
    }

    showMsg('login', 'Login successful. Redirecting…', 'ok')

    setTimeout(() => {
      if (user.role === 'SUPER_ADMIN') navigate('/admin')
      else navigate('/merchant')
    }, 350)
  }

  // Send OTP handler
  const handleSendOtp = () => {
    clearMsg('forgot')

    if (!otpTimer.canRequestNewOtp) {
      showMsg('forgot', `OTP already sent. Try again in ${otpTimer.countdownText}.`, 'err')
      return
    }

    const email = forgotEmail.trim().toLowerCase()
    if (!email) {
      showMsg('forgot', 'Please enter your email.', 'err')
      return
    }
    if (!EMAIL_REGEX.test(email)) {
      showMsg('forgot', 'Please enter a valid email (e.g., name@domain.com).', 'err')
      return
    }

    const otp = otpTimer.sendOtp(email)
    showMsg('forgot', `OTP sent (Demo): ${otp}`, 'ok')
    setOtpValue('')
    setView('otp')
  }

  // Verify OTP handler
  const handleVerifyOtp = () => {
    clearMsg('otp')
    const result = otpTimer.verifyOtp(otpValue)

    if (!result.success) {
      showMsg('otp', result.error, 'err')
      return
    }

    showMsg('otp', 'OTP verified. Set your new password.', 'ok')
    setOtpValue('')
    setNewPw('')
    setConfirmPw('')
    setShowNewPw(false)
    setShowConfirmPw(false)
    setView('reset')
  }

  // Resend OTP handler
  const handleResendOtp = () => {
    clearMsg('otp')

    if (!otpTimer.canRequestNewOtp) {
      showMsg('otp', `Please wait. You can resend in ${otpTimer.countdownText}.`, 'err')
      return
    }

    if (!otpTimer.otpState.email) {
      showMsg('otp', 'Email missing. Please enter email again.', 'err')
      setView('forgot')
      return
    }

    const otp = otpTimer.resendOtp()
    setOtpValue('')
    showMsg('otp', `New OTP sent (Demo): ${otp}`, 'ok')
  }

  // Reset password handler
  const handleResetPassword = () => {
    clearMsg('reset')

    if (!isStrongPassword(newPw)) {
      showMsg('reset', 'Password must be strong: 8+ chars, upper, lower, number, special.', 'err')
      return
    }

    if (newPw !== confirmPw) {
      showMsg('reset', 'Passwords do not match.', 'err')
      return
    }

    const email = otpTimer.otpState.email
    updateUserPassword(email, newPw)

    showMsg('reset', 'Password reset successful. Please login.', 'ok')
    otpTimer.clearOtp()

    setTimeout(() => {
      setView('login')
      setLoginPassword('')
      setNewPw('')
      setConfirmPw('')
      setShowLoginPassword(false)
      setShowNewPw(false)
      setShowConfirmPw(false)
    }, 650)
  }

  const verifyEnabled = otpValue.length === 5 && !otpTimer.isOtpExpired && !!otpTimer.otpState.otp
  const canResetPassword = isStrongPassword(newPw) && newPw === confirmPw && confirmPw.length > 0

  return (
    <div className="min-h-screen grid place-items-center p-4 sm:p-5 md:p-6 lg:p-[22px] bg-[#0b1220] bg-[radial-gradient(1000px_600px_at_15%_0%,rgba(90,167,255,.18),transparent_60%),radial-gradient(900px_520px_at_85%_10%,rgba(47,208,122,.12),transparent_55%),radial-gradient(820px_520px_at_55%_45%,rgba(255,204,102,.07),transparent_60%)]">
      <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4 sm:gap-5 md:gap-6 lg:gap-[18px] rounded-[22px]">
        {/* Brand Panel */}
        <section className="border border-white/12 rounded-[22px] bg-gradient-to-b from-white/[0.06] to-white/[0.03] shadow-card overflow-hidden p-4 sm:p-5 md:p-6 lg:p-[26px] min-h-[auto] lg:min-h-[560px] relative">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-[12px]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-[54px] md:h-[54px] rounded-[18px] border border-white/16 bg-white/[0.04] p-2 flex-shrink-0">
              <img src="/favicon.ico" alt="AssanPay Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="m-0 text-lg sm:text-xl md:text-[22px] font-semibold">AssanPay</h1>
              <p className="mt-1 sm:mt-2 md:mt-[4px] text-[#a9b7d4]/85 text-xs sm:text-[13px]">
                Unified login (Admin + Merchant)
              </p>
            </div>
          </div>

          <p className="mt-3 sm:mt-4 md:mt-3 text-sm sm:text-base text-[#a9b7d4]/90 leading-relaxed">
            Role-based redirect: after successful login, <strong className="text-[#eaf1ff]">SuperAdmin</strong> goes to
            Admin portal and <strong className="text-[#eaf1ff]">Merchant</strong> goes to Merchant portal.
          </p>

          <div className="mt-4 sm:mt-5 md:mt-[18px] p-3 sm:p-4 md:p-[14px] rounded-[18px] border border-white/10 bg-black/18 text-[#a9b7d4]/95 text-xs sm:text-[13px]">
            <strong className="text-[#eaf1ff]">Reset password flow</strong>
            <ul className="mt-2 sm:mt-3 md:mt-[10px] pl-4 sm:pl-5 md:pl-[18px] space-y-1 sm:space-y-2 md:space-y-[6px]">
              <li>Enter email</li>
              <li>Receive OTP (5 digits)</li>
              <li>OTP expires in 1 minute</li>
              <li>Set strong new password</li>
            </ul>
          </div>

          <div className="mt-4 sm:mt-6 md:mt-0 absolute md:static left-4 sm:left-5 md:left-[26px] right-4 sm:right-5 md:right-[26px] bottom-4 sm:bottom-5 md:bottom-[20px] text-[#a9b7d4]/70 text-[10px] sm:text-xs md:text-[12px] leading-relaxed">
            Production note: OTP must be generated + verified on server (not in browser).
          </div>
        </section>

        {/* Auth Panel */}
        <section className="border border-white/12 rounded-[22px] bg-gradient-to-b from-white/[0.06] to-white/[0.03] shadow-card overflow-hidden p-4 sm:p-5 md:p-6 lg:p-[26px] min-h-[auto] lg:min-h-[560px] flex flex-col justify-center">
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <div className="block">
              <div className="mb-3 sm:mb-4 md:mb-[14px]">
                <h2 className="m-0 text-base sm:text-lg md:text-[18px] font-semibold">Sign in</h2>
                <p className="mt-1.5 sm:mt-2 md:mt-[6px] text-[#a9b7d4]/85 text-xs sm:text-[13px]">
                  Enter your email and password.
                </p>
              </div>

              <MessageBox message={msg.target === 'login' ? msg.text : ''} type={msg.type} />

              <form className="mt-3 sm:mt-4 md:mt-[14px] grid gap-3 sm:gap-4 md:gap-[12px]" onSubmit={handleLoginSubmit}>
                <div className="grid gap-1.5 sm:gap-2 md:gap-[6px]">
                  <label htmlFor="loginEmail" className="text-xs sm:text-[13px] text-[#a9b7d4]/95">
                    Email
                  </label>
                  <input
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/12 bg-black/20 text-[#eaf1ff] placeholder:text-[#a9b7d4]/55 focus:outline-none focus:ring-2 focus:ring-[#5aa7ff] focus:ring-offset-2 focus:ring-offset-[#0b1220] text-sm sm:text-base"
                    id="loginEmail"
                    type="email"
                    placeholder="admin@assanpay.com"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value.replace(/\s/g, ''))}
                  />
                </div>

                <PasswordInput
                  id="loginPassword"
                  label="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  showPassword={showLoginPassword}
                  onToggleShow={() => setShowLoginPassword((v) => !v)}
                  helperText="Minimum 8 characters."
                />

                <button
                  className="p-3 sm:p-[12px_14px] rounded-[14px] border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.20)] hover:bg-[rgba(90,167,255,0.28)] cursor-pointer transition-all duration-150 whitespace-nowrap w-full text-sm sm:text-base font-medium"
                  type="submit"
                >
                  Login
                </button>

                <div className="flex gap-2 sm:gap-3 md:gap-[10px] items-center justify-between flex-wrap">
                  <span className="text-[#a9b7d4]/80 text-[10px] sm:text-xs md:text-[12px]">Need help?</span>
                  <button
                    type="button"
                    className="text-[rgba(90,167,255,0.95)] text-xs sm:text-[13px] bg-transparent border-0 p-0 cursor-pointer hover:underline"
                    onClick={() => {
                      clearMsg('forgot')
                      setForgotEmail(loginEmail || '')
                      otpTimer.clearOtp()
                      setView('forgot')
                    }}
                  >
                    Forgot password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <div className="block">
              <div className="mb-3 sm:mb-4 md:mb-[14px]">
                <h2 className="m-0 text-base sm:text-lg md:text-[18px] font-semibold">Reset password</h2>
                <p className="mt-1.5 sm:mt-2 md:mt-[6px] text-[#a9b7d4]/85 text-xs sm:text-[13px]">
                  Enter your email to receive a 5-digit OTP (expires in 1 minute).
                </p>
              </div>

              <MessageBox message={msg.target === 'forgot' ? msg.text : ''} type={msg.type} />

              <div className="grid gap-3 sm:gap-4 md:gap-[12px]">
                <div className="grid gap-1.5 sm:gap-2 md:gap-[6px]">
                  <label htmlFor="forgotEmail" className="text-xs sm:text-[13px] text-[#a9b7d4]/95">
                    Email
                  </label>
                  <input
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/12 bg-black/20 text-[#eaf1ff] placeholder:text-[#a9b7d4]/55 focus:outline-none focus:ring-2 focus:ring-[#5aa7ff] focus:ring-offset-2 focus:ring-offset-[#0b1220] text-sm sm:text-base"
                    id="forgotEmail"
                    type="email"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value.replace(/\s/g, ''))}
                  />

                  {otpTimer.isOtpActive && (
                    <div className="text-[#a9b7d4]/80 text-[10px] sm:text-xs md:text-[12px]">
                      OTP already sent. You can request a new OTP in{' '}
                      <span className="text-[#eaf1ff]">{otpTimer.countdownText}</span>.
                    </div>
                  )}
                  {otpTimer.isOtpExpired && otpTimer.otpState.expiresAt && (
                    <div className="text-[rgba(255,204,102,0.95)] text-[10px] sm:text-xs md:text-[12px]">
                      OTP expired. You can generate a new OTP now.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 md:gap-[10px] items-center justify-between flex-wrap">
                  <button
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/14 bg-white/[0.06] hover:bg-white/[0.10] cursor-pointer transition-all duration-150 whitespace-nowrap text-sm sm:text-base"
                    type="button"
                    onClick={() => {
                      clearMsg('forgot')
                      setView('login')
                      setShowLoginPassword(false)
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    className={`p-3 sm:p-[12px_14px] rounded-[14px] border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.20)] hover:bg-[rgba(90,167,255,0.28)] transition-all duration-150 whitespace-nowrap text-sm sm:text-base font-medium ${!otpTimer.canRequestNewOtp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!otpTimer.canRequestNewOtp}
                  >
                    Send OTP
                  </button>
                </div>

                <div className="mt-3 sm:mt-4 md:mt-[14px] border-t border-white/10 pt-3 sm:pt-4 md:pt-[12px] text-[#a9b7d4]/75 text-[10px] sm:text-xs md:text-[12px] leading-relaxed">
                  Demo only: OTP will be shown in the message box (production: send by email).
                </div>
              </div>
            </div>
          )}

          {/* OTP VIEW */}
          {view === 'otp' && (
            <div className="block">
              <div className="mb-3 sm:mb-4 md:mb-[14px]">
                <h2 className="m-0 text-base sm:text-lg md:text-[18px] font-semibold">Verify OTP</h2>
                <p className="mt-1.5 sm:mt-2 md:mt-[6px] text-[#a9b7d4]/85 text-xs sm:text-[13px]">
                  Enter the 5-digit code.{' '}
                  {otpTimer.otpState.expiresAt && (
                    <span className="text-[#eaf1ff]">Expires in {otpTimer.countdownText}</span>
                  )}
                </p>
              </div>

              <MessageBox message={msg.target === 'otp' ? msg.text : ''} type={msg.type} />

              <div className="grid gap-3 sm:gap-4 md:gap-[12px]">
                <div className="grid gap-1.5 sm:gap-2 md:gap-[6px]">
                  <label htmlFor="otpInput" className="text-xs sm:text-[13px] text-[#a9b7d4]/95">
                    OTP (5 digits)
                  </label>
                  <input
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/12 bg-black/20 text-[#eaf1ff] placeholder:text-[#a9b7d4]/55 focus:outline-none focus:ring-2 focus:ring-[#5aa7ff] focus:ring-offset-2 focus:ring-offset-[#0b1220] text-sm sm:text-base"
                    id="otpInput"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="12345"
                    maxLength={5}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  />

                  <div className="text-[#a9b7d4]/80 text-[10px] sm:text-xs md:text-[12px]">
                    Digits only. Verify button enables at 5 digits (and before expiry).
                  </div>

                  {otpTimer.isOtpExpired && (
                    <div className="text-[rgba(255,90,122,0.95)] text-[10px] sm:text-xs md:text-[12px]">
                      OTP expired. Please generate OTP again.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 md:gap-[10px] items-center justify-between flex-wrap">
                  <button
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/14 bg-white/[0.06] hover:bg-white/[0.10] cursor-pointer transition-all duration-150 whitespace-nowrap text-sm sm:text-base"
                    type="button"
                    onClick={() => {
                      clearMsg('otp')
                      setView('forgot')
                    }}
                  >
                    Change email
                  </button>

                  <button
                    className={`p-3 sm:p-[12px_14px] rounded-[14px] border border-white/14 bg-white/[0.06] hover:bg-white/[0.10] transition-all duration-150 whitespace-nowrap text-sm sm:text-base ${!otpTimer.canRequestNewOtp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!otpTimer.canRequestNewOtp}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  className={`p-3 sm:p-[12px_14px] rounded-[14px] border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.20)] hover:bg-[rgba(90,167,255,0.28)] transition-all duration-150 whitespace-nowrap w-full text-sm sm:text-base font-medium ${!verifyEnabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  type="button"
                  disabled={!verifyEnabled}
                  onClick={handleVerifyOtp}
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* RESET PASSWORD VIEW */}
          {view === 'reset' && (
            <div className="block">
              <div className="mb-3 sm:mb-4 md:mb-[14px]">
                <h2 className="m-0 text-base sm:text-lg md:text-[18px] font-semibold">Set new password</h2>
                <p className="mt-1.5 sm:mt-2 md:mt-[6px] text-[#a9b7d4]/85 text-xs sm:text-[13px]">
                  Must be strong: 8+ chars, upper, lower, number, special.
                </p>
              </div>

              <MessageBox message={msg.target === 'reset' ? msg.text : ''} type={msg.type} />

              <div className="grid gap-3 sm:gap-4 md:gap-[12px]">
                <div className="grid gap-1.5 sm:gap-2 md:gap-[6px]">
                  <label htmlFor="newPw" className="text-xs sm:text-[13px] text-[#a9b7d4]/95">
                    New password
                  </label>

                  <div className="relative">
                    <input
                      className="p-3 sm:p-[12px_14px] pr-12 rounded-[14px] border border-white/12 bg-black/20 text-[#eaf1ff] placeholder:text-[#a9b7d4]/55 focus:outline-none focus:ring-2 focus:ring-[#5aa7ff] focus:ring-offset-2 focus:ring-offset-[#0b1220] text-sm sm:text-base w-full"
                      id="newPw"
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a9b7d4] hover:text-[#eaf1ff] transition"
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <PasswordStrengthMeter password={newPw} />
                </div>

                <PasswordInput
                  id="confirmPw"
                  label="Confirm password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  showPassword={showConfirmPw}
                  onToggleShow={() => setShowConfirmPw((v) => !v)}
                  placeholder="Re-enter password"
                />

                {confirmPw.length > 0 && (
                  <div
                    className={`text-[12px] ${newPw === confirmPw ? 'text-[rgba(47,208,122,0.95)]' : 'text-[rgba(255,90,122,0.95)]'
                      }`}
                  >
                    {newPw === confirmPw ? 'Passwords match ✅' : 'Passwords do not match ❌'}
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3 md:gap-[10px] items-center justify-between flex-wrap">
                  <button
                    className="p-3 sm:p-[12px_14px] rounded-[14px] border border-white/14 bg-white/[0.06] hover:bg-white/[0.10] cursor-pointer transition-all duration-150 whitespace-nowrap text-sm sm:text-base"
                    type="button"
                    onClick={() => {
                      clearMsg('reset')
                      setView('login')
                      setShowLoginPassword(false)
                      setShowNewPw(false)
                      setShowConfirmPw(false)
                    }}
                  >
                    ← Back to login
                  </button>

                  <button
                    className={`p-3 sm:p-[12px_14px] rounded-[14px] border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.20)] hover:bg-[rgba(90,167,255,0.28)] transition-all duration-150 whitespace-nowrap text-sm sm:text-base font-medium ${!canResetPassword ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    type="button"
                    onClick={handleResetPassword}
                    disabled={!canResetPassword}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default LoginPage
