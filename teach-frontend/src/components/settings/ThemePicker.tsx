import { memo } from 'react'
import { useTheme } from '../../theme/useTheme'
import ThemeCard from './ThemeCard'

function ThemePicker() {
  const { themeId, themes, setTheme } = useTheme()

  return (
    <div className="theme-picker" role="group" aria-label="Theme">
      <div className="theme-picker-grid">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={themeId === theme.id}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(ThemePicker)
