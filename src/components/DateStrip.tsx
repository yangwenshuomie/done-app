import { useEffect, useRef } from 'react'
import { toDateKey, todayKey } from '../utils'
import { Entry } from '../types'

const DOW = ['日', '一', '二', '三', '四', '五', '六']

interface Props {
  schedDate: string
  entries: Entry[]
  onSelectDate: (date: string) => void
  onCalOpen: () => void
}

export default function DateStrip({ schedDate, entries, onSelectDate, onCalOpen }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)
  const tKey = todayKey()

  const days = []
  for (let i = -14; i <= 15; i++) {
    const ts = Date.now() + i * 86400000
    const d = new Date(ts)
    const key = toDateKey(ts)
    days.push({ ts, d, key })
  }

  useEffect(() => {
    const sel = stripRef.current?.querySelector('.selected')
    if (sel) sel.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [schedDate])

  const dateObj = new Date(schedDate + 'T00:00:00')
  const monthLabel = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`

  return (
    <div className="date-strip-outer">
      <div className="date-strip-top">
        <div className="month-label">{monthLabel}</div>
        <button className="cal-icon-btn" onClick={onCalOpen} title="选择日期">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      </div>
      <div className="date-strip" ref={stripRef}>
        {days.map(({ d, key }) => {
          const hasDone = entries.some(e => toDateKey(e.ts) === key)
          const cls = [
            'dpill',
            key === tKey ? 'today' : '',
            key === schedDate ? 'selected' : '',
            hasDone ? 'has-done' : '',
          ].filter(Boolean).join(' ')
          return (
            <button key={key} className={cls} onClick={() => onSelectDate(key)}>
              <span className="dow">{DOW[d.getDay()]}</span>
              <span className="dnum">{d.getDate()}</span>
              <span className="ddot" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
