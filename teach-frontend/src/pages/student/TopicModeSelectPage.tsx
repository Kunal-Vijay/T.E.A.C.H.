import { Navigate, useParams } from 'react-router-dom'

/** @deprecated Route now renders StudentTopicCatalogPage with modal. Kept for backward-compatible imports. */
export default function TopicModeSelectPage() {
  const { topicId = '' } = useParams()
  return <Navigate to={`/student/topics/${topicId}`} replace />
}
