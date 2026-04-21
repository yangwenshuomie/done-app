import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useStopwatch } from '../hooks/useStopwatch'
import { createPortal } from 'react-dom'
import TagChips from './TagChips'
import { uid, todayKey } from '../utils'
import { Entry } from '../types'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const ITEM_H = 44

function WheelPicker({ items, value, onChange, label }: {
  items: number[]
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayValue, setDisplayValue] = useState(value)

  const scrollToValue = useCallback((v: number) => {
    const idx = items.indexOf(v)
    if (idx < 0 || !ref.current) return
    ref.current.scrollTop = idx * ITEM_H
  }, [items])

  useEffect(() => {
    scrollToValue(value)
    setDisplayValue(value)
  }, [value, scrollToValue])

  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    setDisplayValue(items[clamped])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(items[clamped])
    }, 120)
  }

  return (
    <div className="wheel-col">
      <div className="wheel-outer">
        <div className="wheel-selector" />
        <div className="wheel-scroll" ref={ref} onScroll={handleScroll}>
          <div className="wheel-pad" />
          {items.map(item => (
            <div key={item} className={`wheel-item${item === displayValue ? ' wheel-item-sel' : ''}`}>
              {String(item).padStart(2, '0')}
            </div>
          ))}
          <div className="wheel-pad" />
        </div>
      </div>
      <span className="wheel-label">{label}</span>
    </div>
  )
}

function FabRunning({ display, onClick }: { display: string | null; onClick: () => void }) {
  return (
    <button className={`fab-running${display ? ' visible' : ''}`} onClick={onClick}>
      <div className="fab-running-dot" />
      <span>{display || '00:00'}</span>
    </button>
  )
}

interface Props {
  open: boolean
  entryId: string | null
  entries: Entry[]
  tags: string[]
  schedDate: string
  onClose: () => void
  onSave: (entry: Entry, isEdit: boolean) => void
  onAddTag: (tagName: string) => boolean
  onDeleteTag: (tagName: string, onDone?: () => void) => void
  showToast: (msg: string) => void
}

export default function DoneSheet({
  open, entryId, entries, tags, schedDate,
  onClose, onSave, onAddTag, onDeleteTag, showToast,
}: Props) {
  const entry: Entry | null = entryId ? (entries.find(e => e.id === entryId) ?? null) : null

  const [text, setText] = useState('')
  const [selTag, setSelTag] = useState<string | null>(null)
  const [durMode, setDurMode] = useState<'manual' | 'stopwatch'>('manual')
  const [selHrs, setSelHrs] = useState(0)
  const [selMins, setSelMins] = useState(0)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const sw = useStopwatch()

  useEffect(() => {
    if (open) {
      setText(entry ? entry.text : '')
      setSelTag(entry ? (entry.tag ?? null) : null)
      setDurMode('manual')
      if (entry?.duration) {
        setSelHrs(Math.floor(entry.duration / 3600))
        setSelMins(Math.round(Math.floor((entry.duration % 3600) / 60) / 5) * 5 % 60)
      } else {
        setSelHrs(0); setSelMins(0)
      }
      if (sw.state !== 'running') sw.reset()
      setTimeout(() => textRef.current?.focus(), 350)
    }
  }, [open, entryId]) // eslint-disable-line react-hooks/exhaustive-deps

  const getDurationSecs = (): number | null => {
    if (durMode === 'stopwatch') return sw.getSeconds()
    const t = selHrs * 3600 + selMins * 60
    return t > 0 ? t : null
  }

  const handleSave = () => {
    if (!text.trim()) { textRef.current?.focus(); return }
    if (!selTag) { showToast('请先选择一个分类'); return }
    const duration = getDurationSecs()
    if (entry) {
      onSave({ ...entry, text: text.trim(), tag: selTag, duration }, true)
    } else {
      const now = new Date(), d = new Date(schedDate + 'T00:00:00')
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
      onSave({ id: uid(), text: text.trim(), tag: selTag, duration, ts: d.getTime() }, false)
    }
    sw.reset()
  }

  const sheetContent = (
    <>
      <div className={`sheet-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`sheet${open ? ' open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-title">{entry ? '编辑记录' : '完成了什么？'}</div>

        <div className="input-group">
          <label className="input-label">事项</label>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="写下刚完成的事…"
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            时长 <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>（可选）</span>
          </label>
          <div className="duration-section">
            <div className="dur-mode-row">
              <button
                className={`dur-mode-btn${durMode === 'manual' ? ' active' : ''}`}
                onClick={() => setDurMode('manual')}
              >✎ 手动</button>
              <button
                className={`dur-mode-btn${durMode === 'stopwatch' ? ' active' : ''}`}
                onClick={() => setDurMode('stopwatch')}
              >⏱ 计时器</button>
            </div>

            {durMode === 'manual' ? (
              <div className="dur-wheel-row">
                <WheelPicker items={HOURS} value={selHrs} onChange={setSelHrs} label="小时" />
                <div className="dur-wheel-sep">:</div>
                <WheelPicker items={MINUTES} value={selMins} onChange={setSelMins} label="分钟" />
              </div>
            ) : (
              <div className="dur-stopwatch">
                <div className={`sw-display${sw.state !== 'running' ? ' paused' : ''}`}>
                  {sw.display}
                </div>
                <div className="sw-controls">
                  {sw.state !== 'idle' && (
                    <button className="sw-btn sw-btn-secondary" onClick={sw.reset}>清除</button>
                  )}
                  <button className="sw-btn sw-btn-primary" onClick={sw.toggle}>
                    {sw.state === 'idle' ? '开始' : sw.state === 'running' ? '停止' : '重新开始'}
                  </button>
                </div>
                {sw.resultText && (
                  <div className="sw-result">{sw.resultText}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">分类</label>
          <TagChips
            tags={tags}
            selectedTag={selTag}
            onSelect={setSelTag}
            onAddTag={onAddTag}
            onDeleteTag={onDeleteTag}
          />
        </div>

        <button className="btn-save" onClick={handleSave}>
          {entry ? '保存修改' : '记下来'}
        </button>
      </div>

      {sw.state === 'running' && (
        <FabRunning display={sw.display} onClick={() => { onClose() }} />
      )}
    </>
  )

  return createPortal(sheetContent, document.body)
}
