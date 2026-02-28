import { apiRequest } from '../utils/apiClient'

export async function sendPasswordResetOtp(email) {
  return apiRequest('/api/auth/forgot-password/send-otp', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}

export async function verifyPasswordResetOtp(email, otp) {
  return apiRequest('/api/auth/forgot-password/verify-otp', {
    method: 'POST',
    body: { email, otp },
    auth: false,
  })
}

export async function resetPasswordWithOtp(email, resetToken, newPassword) {
  return apiRequest('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: { email, resetToken, newPassword },
    auth: false,
  })
}
