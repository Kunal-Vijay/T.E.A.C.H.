import { Sparkles } from 'lucide-react'
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
  heading = 'Welcome to TEACH',
  subtitle,
  steps,
  ctaLabel,
  onCta,
  footnote,
}: OnboardingPanelProps) {
  return (
    <section className="onboarding card" aria-labelledby="onboarding-title">
      <p className="page-kicker onboarding-kicker">
        <Icon icon={Sparkles} size={14} />
        Getting started
      </p>
      <h2 id="onboarding-title" className="page-title onboarding-heading">{heading}</h2>
      {subtitle != null && subtitle !== '' ? (
        <p className="onboarding-subtitle">{subtitle}</p>
      ) : null}
      <ol className="onboarding-steps">
        {steps.map((step, index) => (
          <li key={step.title} className="onboarding-step">
            <span className="onboarding-step-index" aria-hidden="true">{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              {step.detail != null && step.detail !== '' ? <p>{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-primary onboarding-cta" onClick={onCta}>
        {ctaLabel}
      </button>
      {footnote != null && footnote !== '' ? (
        <p className="onboarding-footnote">{footnote}</p>
      ) : null}
    </section>
  )
}
