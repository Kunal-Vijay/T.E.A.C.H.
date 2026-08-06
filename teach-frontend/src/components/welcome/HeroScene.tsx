import {
  BarChart3,
  Brain,
  Check,
  MessageCircle,
  Sparkles,
  Zap,
} from 'lucide-react'
import MentorGifAvatar from '../mentor/MentorGifAvatar'
import Icon from '../ui/Icon'
import { getMentorGifAsset } from '../../lib/mentors/mentorAssets'

/** Premium hero visual — live mentor surrounded by floating product UI cards. */
export default function HeroScene() {
  const mentorAsset = getMentorGifAsset('nova')

  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-scene-ambient" />
      <div className="hero-scene-orbit hero-scene-orbit-a" />
      <div className="hero-scene-orbit hero-scene-orbit-b" />

      <div className="hero-float-card hero-float-card--subtitle hero-float-1">
        <span className="hero-float-label">
          <span className="hero-float-live-dot" />
          Live narration
        </span>
        <p className="hero-float-quote">
          &ldquo;What happens when you push a chair? Let&apos;s discover force together.&rdquo;
        </p>
      </div>

      <div className="hero-float-card hero-float-card--lesson hero-float-2">
        <span className="hero-float-label">Lesson board</span>
        <p className="hero-float-title">Introduction to Force</p>
        <ul className="hero-float-bullets">
          <li><Icon icon={Check} size={14} strokeWidth={2.5} /> Forces are part of everyday life</li>
          <li><Icon icon={Check} size={14} strokeWidth={2.5} /> Force involves two objects</li>
          <li><Icon icon={Check} size={14} strokeWidth={2.5} /> Force changes motion or shape</li>
        </ul>
      </div>

      <div className="hero-float-card hero-float-card--quiz hero-float-3">
        <span className="hero-float-icon-wrap hero-float-icon-wrap--amber">
          <Icon icon={Zap} size={16} />
        </span>
        <div>
          <p className="hero-float-kicker">Pop quiz</p>
          <p className="hero-float-meta">Adaptive · 3 questions</p>
        </div>
      </div>

      <div className="hero-float-card hero-float-card--sage hero-float-4">
        <span className="hero-float-icon-wrap hero-float-icon-wrap--teal">
          <Icon icon={Sparkles} size={16} />
        </span>
        <div>
          <p className="hero-float-kicker">SAGE</p>
          <p className="hero-float-meta">Ask anything · zero judgment</p>
        </div>
      </div>

      <div className="hero-float-card hero-float-card--progress hero-float-5">
        <span className="hero-float-icon-wrap hero-float-icon-wrap--teal">
          <Icon icon={BarChart3} size={16} />
        </span>
        <div className="hero-float-progress">
          <p className="hero-float-kicker">Session progress</p>
          <div className="hero-float-progress-bar">
            <div className="hero-float-progress-fill" />
          </div>
          <p className="hero-float-meta">87% mastery this lesson</p>
        </div>
      </div>

      <div className="hero-float-card hero-float-card--ai hero-float-6">
        <span className="hero-float-icon-wrap hero-float-icon-wrap--midnight">
          <Icon icon={Brain} size={16} />
        </span>
        <div>
          <p className="hero-float-kicker">8 AI mentors</p>
          <p className="hero-float-meta">Unique voice &amp; teaching style</p>
        </div>
      </div>

      <div className="hero-scene-mentor">
        <div className="hero-scene-mentor-glow" />
        <div className="hero-scene-mentor-ring" />
        <MentorGifAvatar mentorId="nova" asset={mentorAsset} label="" />
        <div className="hero-scene-mentor-badge">
          <span className="hero-scene-live-dot" />
          Nova · AI Mentor
        </div>
      </div>

      <div className="hero-float-card hero-float-card--chat hero-float-7">
        <span className="hero-float-icon-wrap hero-float-icon-wrap--teal">
          <Icon icon={MessageCircle} size={16} />
        </span>
        <p className="hero-float-chat">Why does the ball slow down?</p>
      </div>
    </div>
  )
}
