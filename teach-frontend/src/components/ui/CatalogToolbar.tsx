import { memo } from 'react'

interface CatalogToolbarProps {
  count: number
  singularLabel: string
  pluralLabel: string
}

/**
 * List summary bar above catalog grids (student + teacher hubs).
 */
function CatalogToolbar({ count, singularLabel, pluralLabel }: CatalogToolbarProps) {
  return (
    <div className="class-catalog-toolbar">
      <p className="class-catalog-count">
        <strong>{count}</strong>
        {count === 1 ? singularLabel : pluralLabel}
      </p>
    </div>
  )
}

export default memo(CatalogToolbar)
