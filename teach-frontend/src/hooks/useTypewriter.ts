import { useEffect, useState } from 'react'

export function useTypewriter(text: string, active: boolean, speedMs = 14) {
  const [visible, setVisible] = useState('')

  useEffect(() => {
    if (!active) {
      setVisible(text)
      return undefined
    }
    setVisible('')
    let index = 0
    const intervalId = window.setInterval(() => {
      index += 1
      setVisible(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(intervalId)
      }
    }, speedMs)
    return () => window.clearInterval(intervalId)
  }, [text, active, speedMs])

  return visible
}
