import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Icon from '../ui/Icon'

export default function TeacherHubBackLink() {
  return (
    <Link to="/teacher/classes" className="teacher-hub-back">
      <Icon icon={ArrowLeft} size={15} strokeWidth={2} />
      Classes
    </Link>
  )
}
