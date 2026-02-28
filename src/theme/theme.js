export const THEME_STORAGE_KEY = 'assanpay-theme'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'
export const THEME_SYSTEM = 'system'

export const THEME_OPTIONS = [THEME_LIGHT, THEME_DARK, THEME_SYSTEM]

export const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEME_DARK
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT
}

export const resolveTheme = (themeMode) => {
  if (themeMode === THEME_SYSTEM) return getSystemTheme()
  return themeMode === THEME_LIGHT ? THEME_LIGHT : THEME_DARK
}

export const applyTheme = (themeMode) => {
  if (typeof document === 'undefined') return
  const resolvedTheme = resolveTheme(themeMode)
  document.documentElement.setAttribute('data-theme', resolvedTheme)
  document.documentElement.setAttribute('data-theme-mode', themeMode)
}

export const getStoredThemeMode = () => {
  if (typeof window === 'undefined') return THEME_SYSTEM
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return THEME_OPTIONS.includes(stored) ? stored : THEME_SYSTEM
}

export const initializeTheme = () => {
  const themeMode = getStoredThemeMode()
  applyTheme(themeMode)
  return themeMode
}

export const persistThemeMode = (themeMode) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
}
