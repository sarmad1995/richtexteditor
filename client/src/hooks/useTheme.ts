import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'rte_theme'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (saved) return saved
  // Respect OS preference on first visit
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    // Apply/remove the `dark` class that Tailwind's dark: variant responds to
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return { theme, isDark: theme === 'dark', toggle }
}
