import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import TagChips from './TagChips'
import { uid } from '../utils'
import { Todo } from '../types'

interface Props {
  open: boolean
  tags: string[]
  onClose: () => void
  onSave: (todo: Todo) => void
  onAddTag: (tagName: string) => boolean
  onDeleteTag: (tagName: string, onDone?: () => void) => void
}

export default function TodoSheet({ open, tags, onClose, onSave, onAddTag, onDeleteTag }: Props) {
  const [text, setText] = useState('')
  const [selTag, setSelTag] = useState<string | null>(null)
  const [showTime, setShowTime] = useState(false)
  const [time, setTime] = useState('')
  const textRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setSelTag(null)
      setShowTime(false)
      setTime('')
      setTimeout(() => textRef.current?.focus(), 350)
    }
  }, [open])

  const handleSave = () => {
    if (!text.trim()) { textRef.current?.focus(); return }
    onSave({
      id: uid(),
      text: text.trim(),
      tag: selTag,
      time: showTime ? (time || null) : null,
      done: false,
      ts: Date.now(),
    })
  }

  const handleToggleTime = () => {
    setShowTime(v => {
      if (!v) setTimeout(() => document.getElementById('todo-time-inp')?.focus(), 50)
      return !v
    })
  }

  return createPortal(
    <>
      <div className={`todo-sheet-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`todo-sheet${open ? ' open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-title">添加待办</div>

        <div className="input-group">
          <label className="input-label">待办内容</label>
          <input
            ref={textRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="写下待办事项…"
            maxLength={80}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            时间 <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>（可选）</span>
          </label>
          <div>
            <button
              className={`time-toggle${showTime ? ' active' : ''}`}
              onClick={handleToggleTime}
            >
              {showTime ? '✓ 已添加时间' : '＋ 添加时间'}
            </button>
            <div className={`time-field-wrap${showTime ? ' visible' : ''}`}>
              <input
                id="todo-time-inp"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
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

        <button className="btn-save" onClick={handleSave}>添加待办</button>
      </div>
    </>,
    document.body
  )
}
