import { AvatarProvider } from './components/avatar'
import AppRouter from './routes/AppRouter'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import { LearningProgressProvider } from './context/LearningProgressContext'
import { MentorProvider } from './context/MentorContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './theme'
import { EnvironmentProvider } from './environment'

export default function App() {
  return (
    <ThemeProvider>
      <EnvironmentProvider>
        <ErrorBoundary>
          <ToastProvider>
            <LearningProgressProvider>
              <AvatarProvider>
                <MentorProvider>
                  <OfflineBanner />
                  <AppRouter />
                </MentorProvider>
              </AvatarProvider>
            </LearningProgressProvider>
          </ToastProvider>
        </ErrorBoundary>
      </EnvironmentProvider>
    </ThemeProvider>
  )
}
