import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { preloadNovaTutorIdle, scheduleNovaTutorSpeakingPreload } from './lib/tutor/novaTutorAssets'

void preloadNovaTutorIdle()
scheduleNovaTutorSpeakingPreload()

/* Design system foundation */
import './styles/theme.css'
import './styles/theme-transition.css'
import './styles/environments/index.css'
import './styles/typography.css'
import './styles/motion.css'
import './styles/layout.css'
import './styles/utilities.css'

/* Design system components */
import './styles/components/buttons.css'
import './styles/components/cards.css'
import './styles/components/forms.css'
import './styles/components/select.css'
import './styles/components/badges.css'
import './styles/components/panels.css'
import './styles/components/theme-picker.css'
import './styles/components/theme-switcher.css'
import './styles/components/role-selection.css'

/* Base + hub shell */
import './styles/global.css'
import './styles/hub.css'
import './styles/settings.css'

/* Feature surfaces */
import './styles/welcome.css'
import './styles/lesson-content.css'
import './styles/nav.css'
import './styles/student-dashboard.css'
import './styles/class-catalog.css'
import './styles/learning-session.css'
import './styles/topic-session-modal.css'
import './styles/classroom-layout.css'
import './styles/components.css'
import './styles/delight.css'
import './styles/mentor.css'
import './styles/nova-tutor.css'
import './styles/product-shell.css'
import './styles/classroom-immersive.css'
import './styles/lesson-board.css'
import './styles/mentor-panel.css'
import './styles/voice-player.css'
import './styles/voice-doubt.css'
import './styles/classroom-tutor-experience.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
