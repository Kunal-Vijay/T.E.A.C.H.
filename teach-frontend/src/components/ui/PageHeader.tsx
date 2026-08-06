import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker?: string
  title: string
  lede?: string
  action?: ReactNode
  back?: ReactNode
}

export default function PageHeader({ kicker, title, lede, action, back }: PageHeaderProps) {
  return (
    <header className={`page-header${action != null ? ' page-header-with-action' : ''}`}>
      {back != null ? <div className="page-header-back">{back}</div> : null}
      <div className="page-header-body">
        <div className="page-header-copy">
          {kicker != null && kicker !== '' ? <p className="page-kicker">{kicker}</p> : null}
          <h2 className="page-title">{title}</h2>
          {lede != null && lede !== '' ? <p className="page-lede">{lede}</p> : null}
        </div>
        {action != null ? <div className="page-header-action">{action}</div> : null}
      </div>
    </header>
  )
}
