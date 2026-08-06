import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker?: string
  title: string
  lede?: string
  action?: ReactNode
  back?: ReactNode
  /** Premium dark-hub styling for student dashboard */
  variant?: 'default' | 'hub'
}

export default function PageHeader({
  kicker,
  title,
  lede,
  action,
  back,
  variant = 'default',
}: PageHeaderProps) {
  return (
    <header
      className={`page-header${action != null ? ' page-header-with-action' : ''}${variant === 'hub' ? ' page-header--hub' : ''}`}
    >
      {back != null ? <div className="page-header-back">{back}</div> : null}
      <div className="page-header-body">
        <div className="page-header-copy">
          {kicker != null && kicker !== '' ? <p className="page-kicker">{kicker}</p> : null}
          <h1 className="page-title">{title}</h1>
          {lede != null && lede !== '' ? <p className="page-lede">{lede}</p> : null}
        </div>
        {action != null ? <div className="page-header-action">{action}</div> : null}
      </div>
    </header>
  )
}
