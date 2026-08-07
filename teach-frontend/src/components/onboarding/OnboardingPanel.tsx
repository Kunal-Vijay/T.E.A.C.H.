import { Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'

interface OnboardingStep {
  title: string
  detail?: string
}

interface OnboardingPanelProps {
  heading?: string
  subtitle?: string
  steps: OnboardingStep[]
  ctaLabel: string
  onCta: () => void
  footnote?: string
}

export default function OnboardingPanel({
  heading = 'Welcome to T.E.A.C.H',
  subtitle,
  steps,
  ctaLabel,
  onCta,
  footnote,
}: OnboardingPanelProps) {
  return (
    <section className="onboarding onboarding-panel card" aria-labelledby="onboarding-title">
      <p className="page-kicker onboarding-kicker">
        <Icon icon={Sparkles} size={14} />
        Getting started
      </p>
      <h2 id="onboarding-title" className="onboarding-heading">{heading}</h2>
      {subtitle != null && subtitle !== '' ? (
        <p className="onboarding-subtitle">{subtitle}</p>
      ) : null}
      <ol className="onboarding-steps">
        {steps.map((step, index) => (
          <li key={step.title} className="onboarding-step">
            <span className="onboarding-step-index" aria-hidden="true">{index + 1}</span>
            <div className="onboarding-step-copy">
              <h3>{step.title}</h3>
              {step.detail != null && step.detail !== '' ? <p>{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="primary" withIcon className="onboarding-cta" onClick={onCta}>
        {ctaLabel}
      </Button>
      {footnote != null && footnote !== '' ? (
        <p className="onboarding-footnote">{footnote}</p>
      ) : null}
    </section>
  )
}
