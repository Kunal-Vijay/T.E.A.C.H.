interface DashboardHeroSkeletonProps {
  showStats?: boolean
}

export default function DashboardHeroSkeleton({ showStats = true }: DashboardHeroSkeletonProps) {
  return (
    <div className="dashboard-hero-skeleton" aria-hidden="true">
      <div className="dashboard-hero-skeleton-copy">
        <div className="skeleton skeleton-kicker" />
        <div className="skeleton skeleton-page-title" />
        <div className="skeleton skeleton-lede" />
      </div>
      {showStats ? <div className="skeleton skeleton-stats-bar" /> : null}
    </div>
  )
}
