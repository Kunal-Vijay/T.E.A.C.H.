import { useState } from 'react'
import SageLogo from '../branding/SageLogo'
import type { DoubtMessageResponse } from '../../types/api.types'

interface SageDoubtPanelProps {
  onAsk: (message: string) => Promise<DoubtMessageResponse>
  onClose: () => Promise<void>
}

export default function SageDoubtPanel({ onAsk, onClose }: SageDoubtPanelProps) {
  const [messages, setMessages] = useState<DoubtMessageResponse[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const submitMessage = async () => {
    if (inputValue.trim() === '' || loading) {
      return
    }
    setLoading(true)
    try {
      const response = await onAsk(inputValue.trim())
      setMessages((previousMessages) => [...previousMessages, response])
      setInputValue('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sage-panel card">
      <SageLogo />
      <div className="sage-messages">
        {messages.map((message) => (
          <div key={message.message_id} className="sage-message-block">
            <div className="student-message"><strong>You:</strong> {message.student_message}</div>
            <div className="sage-message"><strong>SAGE:</strong> {message.ai_response}</div>
          </div>
        ))}
      </div>
      <div className="sage-input-row">
        <input
          className="input"
          placeholder="Type your doubt..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submitMessage()
            }
          }}
        />
        <button className="btn btn-sage" onClick={submitMessage} disabled={loading}>Ask</button>
      </div>
      <button className="btn btn-secondary" onClick={onClose}>Done — move to next topic</button>
      <style>{`
        .sage-panel { position: fixed; inset: 0; margin: auto; width: min(520px, calc(100% - 2rem)); height: min(620px, calc(100% - 2rem)); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; z-index: 20; }
        .sage-messages { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 0.75rem; background: var(--sage-bg); border-radius: 12px; padding: 0.75rem; }
        .student-message, .sage-message { padding: 0.5rem 0.75rem; border-radius: 10px; background: white; }
        .sage-input-row { display: flex; gap: 0.5rem; }
      `}</style>
    </div>
  )
}
