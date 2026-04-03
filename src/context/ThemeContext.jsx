import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context.js'
import { APP_THEMES, DEFAULT_THEME_ID, THEME_STORAGE_KEY } from '../utils/themes.js'

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID)

  const activeTheme = useMemo(
    () => APP_THEMES.find((item) => item.id === themeId) || APP_THEMES[0],
    [themeId],
  )

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = activeTheme.id
    root.classList.toggle('dark', activeTheme.mode === 'dark')

    Object.entries(activeTheme.tokens).forEach(([token, value]) => {
      root.style.setProperty(`--${token}`, value)
    })

    localStorage.setItem(THEME_STORAGE_KEY, activeTheme.id)
  }, [activeTheme])

  const value = useMemo(
    () => ({
      theme: activeTheme,
      themes: APP_THEMES,
      setTheme: setThemeId,
    }),
    [activeTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
