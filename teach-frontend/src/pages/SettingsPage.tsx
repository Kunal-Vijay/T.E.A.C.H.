import { AppPage, GlassPanel, PageHeader, SectionTitle } from '../components/ui'
import EnvironmentPicker from '../components/settings/EnvironmentPicker'
import ThemePicker from '../components/settings/ThemePicker'
import { getRole } from '../services/auth/authService'

export default function SettingsPage() {
  const role = getRole()
  const isTeacher = role === 'teacher'

  return (
    <AppPage
      variant={isTeacher ? 'teacher-wide' : 'student'}
      className="settings-page"
    >
      <PageHeader
        variant="hub"
        kicker="Account"
        title="Settings"
        lede="Personalize your T.E.A.C.H experience."
      />

      <GlassPanel aria-labelledby="settings-appearance-heading">
        <div className="settings-section">
          <SectionTitle id="settings-appearance-heading" as="h2">
            Appearance
          </SectionTitle>
          <p className="settings-section-lede">
            Choose a color theme for the interface. Your selection applies instantly and is saved for next time.
          </p>
          <ThemePicker />
        </div>
      </GlassPanel>

      <GlassPanel aria-labelledby="settings-environment-heading">
        <div className="settings-section">
          <SectionTitle id="settings-environment-heading" as="h2">
            Classroom environment
          </SectionTitle>
          <p className="settings-section-lede">
            Set the ambience around your learning space — background, lighting, and subtle effects.
            Environments work independently from your color theme.
          </p>
          <EnvironmentPicker />
        </div>
      </GlassPanel>
    </AppPage>
  )
}
