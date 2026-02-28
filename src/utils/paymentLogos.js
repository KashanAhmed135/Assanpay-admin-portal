const LOGO_MAP = {
  jazzcash: '/assets/payment-logos/jazzcash.jpeg',
  easypaisa: '/assets/payment-logos/easypaisa-light.jpeg',
  upaisa: '/assets/payment-logos/upaisa.jpeg',
  card: '/assets/payment-logos/card.jpeg',
  raast: '/assets/payment-logos/raast.jpeg',
  zindagi: '/assets/payment-logos/zindagi.jpeg',
}

const normalizeKey = (value) => (value || '')
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

export function getPaymentMethodLogo(methodName) {
  if (!methodName) return null
  const key = normalizeKey(methodName)
  if (LOGO_MAP[key]) return LOGO_MAP[key]
  if (key.includes('jazzcash')) return LOGO_MAP.jazzcash
  if (key.includes('easypaisa') || key.includes('easypay')) return LOGO_MAP.easypaisa
  if (key.includes('upaisa') || key.includes('u-paisa') || key.includes('uPaisa')) return LOGO_MAP.upaisa
  if (key.includes('raast')) return LOGO_MAP.raast
  if (key.includes('card')) return LOGO_MAP.card
  if (key.includes('zindagi')) return LOGO_MAP.zindagi
  return null
}
