import { useState } from 'react'
import { toDateKey, todayKey, pad } from '../utils'
import { Entry } from '../types'

interface Props {
  schedDate: string
  entries: Entry[]
  onConfirm: (date: string) => void
  onClose: () => void
}

export default function CalendarPicker({ schedDate, entries, onConfirm, onClose }: Props) {
  const initDate = new Date(schedDate + 'T00:00:00')
  const [year, setYear] = useState(initDate.getFullYear())
  const [month, setMonth] = useState(initDate.getMonth())
  const [tempDate, setTempDate] = useState(schedDate)

  const tKey = todayKey()

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (null | { day: number; key: string })[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, key: `${year}-${pad(month + 1)}-${pad(day)}` })
  }

  return (
    <div className="cal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-sheet" onClick={e => e.stopPropagation()}>
        <div className="cal-handle" />
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <div className="cal-nav-title">{year}年{month + 1}月</div>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <div className="cal-dow-row">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="cal-dow-cell">{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((cell, i) => {
            if (!cell) return <button key={`empty-${i}`} className="cal-cell" />
            const hasDone = entries.some(e => toDateKey(e.ts) === cell.key)
            const cls = [
              'cal-cell',
              cell.key === tKey ? 'today' : '',
              cell.key === tempDate ? 'selected' : '',
              hasDone ? 'has-done' : '',
            ].filter(Boolean).join(' ')
            return (
              <button key={cell.key} className={cls} onClick={() => setTempDate(cell.key)}>
                {cell.day}
              </button>
            )
          })}
        </div>
        <button className="cal-confirm" onClick={() => onConfirm(tempDate)}>确定</button>
      </div>
    </div>
  )
}
