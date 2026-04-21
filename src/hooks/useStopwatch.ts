import { useState, useRef, useEffect, useCallback } from 'react'
import { secsToClock, fmtDuration } from '../utils'

type StopwatchState = 'idle' | 'running' | 'done'

export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>('idle')
  const [display, setDisplay] = useState('00:00')
  const [resultText, setResultText] = useState('')
  const accumRef = useRef(0)
  const startRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    const s = Math.floor((accumRef.current + (Date.now() - startRef.current)) / 1000)
    setDisplay(secsToClock(s))
  }, [])

  const toggle = useCallback(() => {
    setState(prev => {
      if (prev === 'idle') {
        startRef.current = Date.now()
        intervalRef.current = setInterval(tick, 500)
        return 'running'
      }
      if (prev === 'running') {
        accumRef.current += Date.now() - startRef.current
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        const secs = Math.floor(accumRef.current / 1000)
        setResultText(`已计时 ${fmtDuration(secs)}，保存时将记录`)
        return 'done'
      }
      // done -> restart
      accumRef.current = 0
      startRef.current = Date.now()
      intervalRef.current = setInterval(tick, 500)
      setResultText('')
      return 'running'
    })
  }, [tick])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    accumRef.current = 0
    startRef.current = 0
    setDisplay('00:00')
    setResultText('')
    setState('idle')
  }, [])

  const getSeconds = useCallback((): number | null => {
    if (state === 'done' && accumRef.current > 0) {
      return Math.floor(accumRef.current / 1000)
    }
    return null
  }, [state])

  const runningDisplay = state === 'running' ? display : null

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return { state, display, resultText, toggle, reset, getSeconds, runningDisplay }
}
