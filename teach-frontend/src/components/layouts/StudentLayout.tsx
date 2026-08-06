import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Volume2, VolumeX } from 'lucide-react'
import TeachLogo from '../branding/TeachLogo'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'
import Icon from '../ui/Icon'
import { useMentor } from '../../context/MentorContext'
import { clearAuth } from '../../services/auth/authService'
import {
  getAnimationIntensity,
  isMentorSpeechMuted,
  setAnimationIntensity,
  setMentorSpeechMuted,
} from '../../services/mentor/mentorPreferences'
import type { AnimationIntensity } from '../../types/mentor.types'

export default function StudentLayout() {
  const navigate = useNavigate()
  const { mentor } = useMentor()
  const [speechMuted, setSpeechMutedState] = useState(() => isMentorSpeechMuted())
  const [animationIntensity, setAnimationIntensityState] = useState<AnimationIntensity>(() => getAnimationIntensity())

  useEffect(() => {
    const sync = () => {
      setSpeechMutedState(isMentorSpeechMuted())
      setAnimationIntensityState(getAnimationIntensity())
    }
    window.addEventListener('storage', sync)
    window.addEventListener('teach-mentor-preferences', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('teach-mentor-preferences', sync)
    }
  }, [])

  const switchRole = () => {
    clearAuth()
    navigate('/')
  }

  const toggleSpeechMuted = () => {
    const next = !speechMuted
    setMentorSpeechMuted(next)
    setSpeechMutedState(next)
  }

  const handleAnimationIntensity = (value: AnimationIntensity) => {
    setAnimationIntensity(value)
    setAnimationIntensityState(value)
  }

  return (
    <div className="page dashboard student-dashboard">
      <header className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div className="dashboard-brand">
            <Link to="/student" className="dashboard-logo-link" aria-label="Student dashboard home">
              <TeachLogo showTagline={false} />
            </Link>
            <span className="role-badge">Student</span>
            {mentor !== null ? (
              <Link to="/student/mentor" className="dashboard-mentor-chip" aria-label={`Change mentor — currently ${mentor.name}`}>
                <span aria-hidden="true">
                  <StudyMentorAvatar mentor={mentor} size="sm" showGlow={false} ariaLabel="" />
                </span>
                <span>{mentor.name}</span>
              </Link>
            ) : null}
          </div>
          <nav className="dashboard-nav" aria-label="Student">
            <div className="mentor-pref-panel">
              <button
                type="button"
                className={`dashboard-nav-link mentor-pref-toggle btn-with-icon${speechMuted ? ' is-muted' : ''}`}
                onClick={toggleSpeechMuted}
                aria-pressed={speechMuted}
                title={speechMuted ? 'Unmute mentor speech' : 'Mute mentor speech'}
              >
                <Icon icon={speechMuted ? VolumeX : Volume2} size={16} className="nav-link-icon" />
                {speechMuted ? 'Muted' : 'Speech'}
              </button>
              <label className="sr-only" htmlFor="mentor-animation-intensity">Animation intensity</label>
              <select
                id="mentor-animation-intensity"
                className="mentor-pref-select"
                value={animationIntensity}
                onChange={(event) => handleAnimationIntensity(event.target.value as AnimationIntensity)}
                aria-label="Mentor animation intensity"
              >
                <option value="full">Full motion</option>
                <option value="reduced">Reduced motion</option>
                <option value="minimal">Minimal motion</option>
              </select>
            </div>
            <NavLink
              to="/student"
              end
              className={({ isActive }) => `dashboard-nav-link btn-with-icon${isActive ? ' is-active' : ''}`}
            >
              <Icon icon={LayoutGrid} size={16} className="nav-link-icon" />
              Classes
            </NavLink>
            <button type="button" className="dashboard-nav-link dashboard-exit btn-with-icon" onClick={switchRole}>
              <Icon icon={LogOut} size={16} className="nav-link-icon" />
              Switch role
            </button>
          </nav>
        </div>
      </header>
      <div id="main-content">
        <Outlet />
      </div>
    </div>
  )
}
