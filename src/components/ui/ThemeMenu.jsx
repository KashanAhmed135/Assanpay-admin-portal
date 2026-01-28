import { useEffect, useRef, useState } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'assanpay-theme'

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (theme) => {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.setAttribute('data-theme-mode', theme)
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('dark')
  const menuRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'system'
    setTheme(saved)
    applyTheme(saved)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyTheme('system')
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
    localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)
    applyTheme(next)
    setOpen(false)
  }

  const resolved = theme === 'system' ? getSystemTheme() : theme

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] grid place-items-center text-[#a9b7d4] hover:bg-white/[0.08] transition"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme"
      >
        {resolved === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#1f2435] shadow-card overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
            type="button"
            onClick={() => setAndClose('light')}
          >
            <Sun size={14} />
            Light
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
            type="button"
            onClick={() => setAndClose('dark')}
          >
            <Moon size={14} />
            Dark
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
            type="button"
            onClick={() => setAndClose('system')}
          >
            <Laptop size={14} />
            System
          </button>
        </div>
      )}
    </div>
  )
}
