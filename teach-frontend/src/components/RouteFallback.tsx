import { AppPage, PageHeader, SkeletonCardGrid } from './ui'

export default function RouteFallback() {
  return (
    <AppPage>
      <PageHeader kicker="T.E.A.C.H" title="Loading…" lede="Preparing this view." />
      <SkeletonCardGrid count={3} />
    </AppPage>
  )
}
