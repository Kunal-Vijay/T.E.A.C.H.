import { useState } from 'react'
import {
  Eraser,
  Maximize2,
  Minus,
  PenLine,
  Plus,
  RotateCcw,
  Undo2,
} from 'lucide-react'
import LearningWhiteboard from '../classroom/LearningWhiteboard'
import Icon from '../ui/Icon'
import { Button } from '../ui'

interface LiveClassroomBoardPaneProps {
  elements: Array<Record<string, unknown>>
  slideKey: string
  currentTopic: string
  slideLabel: string
  showContinue: boolean
  showNextSlide: boolean
  continueLabel: string
  canContinue: boolean
  onContinue: () => void
}

const ZOOM_STEPS = [75, 90, 100, 110, 125, 150]

export default function LiveClassroomBoardPane({
  elements,
  slideKey,
  currentTopic,
  slideLabel,
  showContinue,
  showNextSlide,
  continueLabel,
  canContinue,
  onContinue,
}: LiveClassroomBoardPaneProps) {
  const [zoomIndex, setZoomIndex] = useState(2)

  const zoom = ZOOM_STEPS[zoomIndex] ?? 100

  const zoomOut = () => {
    setZoomIndex((current) => Math.max(0, current - 1))
  }

  const zoomIn = () => {
    setZoomIndex((current) => Math.min(ZOOM_STEPS.length - 1, current + 1))
  }

  const resetZoom = () => {
    setZoomIndex(2)
  }

  return (
    <section className="live-classroom-board" aria-label="Lesson whiteboard">
      <div className="live-classroom-board__topic-card">
        <p className="live-classroom-board__topic-label">Current Topic</p>
        <p className="live-classroom-board__topic-title">{currentTopic}</p>
        <p className="live-classroom-board__topic-slide">{slideLabel}</p>
      </div>

      <div className="live-classroom-board__canvas">
        <div
          className="live-classroom-board__zoom-layer"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <LearningWhiteboard
            elements={elements}
            slideKey={slideKey}
            variant="marker"
          />
        </div>
      </div>

      <div className="live-classroom-board__toolbar live-classroom-board__toolbar--left">
        <button type="button" className="live-classroom-tool" disabled title="Pen (coming soon)">
          <Icon icon={PenLine} size={17} />
        </button>
        <button type="button" className="live-classroom-tool" disabled title="Eraser (coming soon)">
          <Icon icon={Eraser} size={17} />
        </button>
        <button type="button" className="live-classroom-tool" disabled title="Undo (coming soon)">
          <Icon icon={Undo2} size={17} />
        </button>
      </div>

      <div className="live-classroom-board__toolbar live-classroom-board__toolbar--right">
        <div className="live-classroom-zoom" aria-label="Board zoom">
          <button type="button" className="live-classroom-zoom__btn" onClick={zoomOut} aria-label="Zoom out">
            <Icon icon={Minus} size={16} />
          </button>
          <span className="live-classroom-zoom__label">{zoom}%</span>
          <button type="button" className="live-classroom-zoom__btn" onClick={zoomIn} aria-label="Zoom in">
            <Icon icon={Plus} size={16} />
          </button>
          <button type="button" className="live-classroom-zoom__btn" onClick={resetZoom} aria-label="Reset zoom">
            <Icon icon={RotateCcw} size={15} />
          </button>
          <button type="button" className="live-classroom-zoom__btn" disabled title="Fit to screen">
            <Icon icon={Maximize2} size={15} />
          </button>
        </div>
      </div>

      {(showContinue || showNextSlide) ? (
        <div className="live-classroom-board__continue">
          <Button
            type="button"
            variant={showContinue ? 'primary' : 'secondary'}
            disabled={!canContinue}
            onClick={onContinue}
          >
            {continueLabel}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
