import { memo } from 'react'

export type ClassCardSkeletonVariant = 'student' | 'teacher'

interface ClassCardSkeletonProps {
  count?: number
  variant?: ClassCardSkeletonVariant
}

function ClassCardSkeleton({ count = 6, variant = 'student' }: ClassCardSkeletonProps) {
  return (
    <div className="class-catalog-grid class-catalog-grid--loading" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`class-catalog-card class-catalog-card--skeleton${variant === 'teacher' ? ' teacher-class-card--skeleton' : ''}`}
        >
          <div className="skeleton class-catalog-skeleton-badge" />
          <div className="skeleton class-catalog-skeleton-title" />
          <div className="class-catalog-skeleton-meta">
            <div className="skeleton class-catalog-skeleton-line" />
            <div className="skeleton class-catalog-skeleton-line" />
            <div className="skeleton class-catalog-skeleton-line class-catalog-skeleton-line-short" />
          </div>
          <div
            className={`skeleton class-catalog-skeleton-cta${variant === 'teacher' ? ' teacher-class-skeleton-hint' : ''}`}
          />
        </div>
      ))}
    </div>
  )
}

export default memo(ClassCardSkeleton)
