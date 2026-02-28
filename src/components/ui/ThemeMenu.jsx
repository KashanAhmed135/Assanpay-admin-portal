import { useEffect, useRef, useState } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import {
  THEME_DARK,
  THEME_LIGHT,
  THEME_SYSTEM,
  applyTheme,
  getStoredThemeMode,
  getSystemTheme,
  persistThemeMode,
} from '../../theme/theme'

export function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(THEME_SYSTEM)
  const menuRef = useRef(null)

  useEffect(() => {
    const saved = getStoredThemeMode()
    setTheme(saved)
    applyTheme(saved)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === THEME_SYSTEM) applyTheme(THEME_SYSTEM)
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [theme])

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const setAndClose = (next) => {
    persistThemeMode(next)
    setTheme(next)
    applyTheme(next)
    setOpen(false)
  }

  const resolved = theme === THEME_SYSTEM ? getSystemTheme() : theme

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="h-9 w-9 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] grid place-items-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme"
      >
        {resolved === THEME_DARK ? <Moon size={16} /> : <Sun size={16} />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-card overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
            type="button"
            onClick={() => setAndClose(THEME_LIGHT)}
          >
            <Sun size={14} />
            Light
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
            type="button"
            onClick={() => setAndClose(THEME_DARK)}
          >
            <Moon size={14} />
            Dark
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
            type="button"
            onClick={() => setAndClose(THEME_SYSTEM)}
          >
            <Laptop size={14} />
            System
          </button>
        </div>
      )}
    </div>
  )
}
