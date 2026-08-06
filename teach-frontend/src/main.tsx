import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/theme.css'
import './styles/global.css'
import './styles/welcome.css'
import './styles/lesson-content.css'
import './styles/dashboard.css'
import './styles/components.css'
import './styles/delight.css'
import './styles/motion.css'
import './styles/mentor.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
