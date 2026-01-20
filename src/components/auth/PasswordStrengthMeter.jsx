import { Check, X } from 'lucide-react'
import { passwordRules, passwordScore, strengthLabel, getStrengthColor, getStrengthTextColor } from '../../utils/passwordValidator'

export function PasswordStrengthMeter({ password }) {
    const pwScore = passwordScore(password)
    const pwLabel = strengthLabel(pwScore)
    const pwRules = passwordRules(password)
    const strengthColor = getStrengthColor(pwScore)
    const strengthText = getStrengthTextColor(pwScore)

    return (
        <div className="mt-2 rounded-[14px] border border-white/10 bg-black/18 p-3">
            <div className="flex items-center justify-between">
                <span className="text-[#a9b7d4]/85 text-[12px]">Password strength</span>
                <span className={`text-[12px] font-medium ${strengthText}`}>{pwLabel}</span>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`h-full ${strengthColor} transition-all duration-300`}
                    style={{ width: `${(pwScore / 4) * 100}%` }}
                />
            </div>

            <div className="mt-3 grid gap-1 text-[12px]">
                {[
                    ['At least 8 characters', pwRules.length],
                    ['One uppercase (A-Z)', pwRules.upper],
                    ['One lowercase (a-z)', pwRules.lower],
                    ['One number (0-9)', pwRules.number],
                    ['One special character (!@#...)', pwRules.special],
                ].map(([label, ok]) => (
                    <div key={label} className="flex items-center gap-2">
                        {ok ? (
                            <Check size={14} className="text-[rgba(47,208,122,0.95)]" />
                        ) : (
                            <X size={14} className="text-[rgba(255,90,122,0.95)]" />
                        )}
                        <span className={ok ? 'text-[rgba(47,208,122,0.95)]' : 'text-[#a9b7d4]/80'}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
