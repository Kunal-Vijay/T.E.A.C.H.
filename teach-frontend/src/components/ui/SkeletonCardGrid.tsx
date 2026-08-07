interface SkeletonCardGridProps {
  count?: number
}

export default function SkeletonCardGrid({ count = 6 }: SkeletonCardGridProps) {
  return (
    <div className="grid-cards skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card skeleton-card">
          <div className="skeleton skeleton-badge" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  )
}
