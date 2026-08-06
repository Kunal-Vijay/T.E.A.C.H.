import PageHeader from './ui/PageHeader'
import SkeletonCardGrid from './ui/SkeletonCardGrid'

export default function RouteFallback() {
  return (
    <main className="container page-main">
      <PageHeader kicker="TEACH" title="Loading…" lede="Preparing this view." />
      <SkeletonCardGrid count={3} />
    </main>
  )
}
