import { Palette } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.js'

export default function ThemeToggle() {
  const { theme, themes, setTheme } = useTheme()

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 text-sm shadow-sm theme-chip" aria-label="Theme selector">
      <Palette className="h-4 w-4" />
      <select
        value={theme.id}
        onChange={(event) => setTheme(event.target.value)}
        className="max-w-44 bg-transparent text-sm font-medium outline-none"
      >
        {themes.map((item) => (
          <option key={item.id} value={item.id} className="text-slate-900">
            {item.name}
          </option>
        ))}
      </select>
    </label>
  )
}
