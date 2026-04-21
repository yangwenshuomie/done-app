import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toDateKey, formatTime, fmtDuration } from '../utils'
import { Entry, Todo } from '../types'

interface ContextMenuProps {
  x: number
  y: number
  onEdit: () => void
  onRestore: () => void
  onDelete: () => void
  onClose: () => void
}

function ContextMenu({ x, y, onEdit, onRestore, onDelete, onClose }: ContextMenuProps) {
  return createPortal(
    <>
      <div className="ctx-backdrop" onClick={onClose} />
      <div className="ctx-menu" style={{ left: x, top: y }}>
        <button className="ctx-item" onClick={() => { onClose(); onEdit() }}>
          <svg viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </button>
        <button className="ctx-item" onClick={() => { onClose(); onRestore() }}>
          <svg viewBox="0 0 24 24">
            <path d="M9 14L4 9l5-5"/>
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
          </svg>
          恢复为待办
        </button>
        <button className="ctx-item danger" onClick={() => { onClose(); onDelete() }}>
          <svg viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          删除
        </button>
      </div>
    </>,
    document.body
  )
}

function DoneItem({ entry, onEdit, onRestore, onDelete }: {
  entry: Entry
  onEdit: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  const [pressed, setPressed] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMenu = useCallback((clientX: number, clientY: number) => {
    const vw = window.innerWidth, vh = window.innerHeight
    const mw = 170, mh = 130
    let x = clientX, y = clientY + 8
    if (x + mw > vw - 8) x = vw - mw - 8
    if (y + mh > vh - 8) y = clientY - mh - 8
    setMenu({ x, y })
    setPressed(false)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setPressed(false)
    pressTimerRef.current = setTimeout(() => {
      setPressed(true)
      openMenu(touch.clientX, touch.clientY)
    }, 480)
  }

  const onTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
    setPressed(false)
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    openMenu(e.clientX, e.clientY)
  }

  return (
    <>
      <div
        className={`done-item${pressed ? ' pressed' : ''}`}
        onContextMenu={onContextMenu}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onTouchMove={onTouchEnd}
      >
        <div className="done-dot" />
        <div className="done-body">
          <div className="done-title-row">
            <span className="done-text">{entry.text}</span>
            <span className="done-time">{formatTime(entry.ts)}</span>
          </div>
          <div className="done-meta">
            {entry.tag && <span className="done-tag">{entry.tag}</span>}
            {entry.duration && <span className="done-dur">⏱{fmtDuration(entry.duration)}</span>}
          </div>
        </div>
      </div>
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onEdit={onEdit}
          onRestore={onRestore}
          onDelete={onDelete}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}

function TodoItem({ todo, onComplete, onDelete }: {
  todo: Todo
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [fading, setFading] = useState(false)

  const handleComplete = () => {
    setFading(true)
    setTimeout(() => onComplete(todo.id), 200)
  }

  const handleDelete = () => {
    setFading(true)
    setTimeout(() => onDelete(todo.id), 200)
  }

  return (
    <div className="todo-item" style={fading ? { opacity: 0, transition: 'opacity .2s' } : {}}>
      <button className="todo-check" onClick={handleComplete} />
      <div className="todo-body">
        <div className="todo-text">{todo.text}</div>
        <div className="todo-row2">
          {todo.tag && <span className="todo-tag-badge">{todo.tag}</span>}
          {todo.time && <span className="todo-time-badge">🕐 {todo.time}</span>}
        </div>
      </div>
      <button className="todo-del" onClick={handleDelete}>×</button>
    </div>
  )
}

interface Props {
  schedDate: string
  entries: Entry[]
  todos: Todo[]
  onDeleteEntry: (id: string) => void
  onRestoreEntry: (id: string) => void
  onEditEntry: (id: string) => void
  onCompleteTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
  onAddTodo: () => void
  onPrevDay: () => void
  onNextDay: () => void
}

export default function ScheduleView({
  schedDate, entries, todos,
  onDeleteEntry, onRestoreEntry, onEditEntry,
  onCompleteTodo, onDeleteTodo, onAddTodo,
  onPrevDay, onNextDay,
}: Props) {
  const dayDone = [...entries].reverse().filter(e => toDateKey(e.ts) === schedDate)
  const pending = todos.filter(t => !t.done)

  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    const dy = e.changedTouches[0].clientY - swipeStartY.current
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      dx < 0 ? onNextDay() : onPrevDay()
    }
  }

  return (
    <div className="sched-body" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="sched-col sched-col-left">
        <div className="sched-col-header">已完成</div>
        {dayDone.length === 0
          ? <div className="sched-empty">暂无记录</div>
          : dayDone.map(entry => (
            <DoneItem
              key={entry.id}
              entry={entry}
              onEdit={() => onEditEntry(entry.id)}
              onRestore={() => onRestoreEntry(entry.id)}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))
        }
      </div>

      <div className="sched-col sched-col-right">
        <div className="sched-col-header">待办</div>
        {pending.length === 0
          ? <div className="sched-empty">暂无待办</div>
          : pending.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onComplete={onCompleteTodo}
              onDelete={onDeleteTodo}
            />
          ))
        }
        <div className="todo-add-btn-row">
          <button className="todo-add-trigger" onClick={onAddTodo}>添加待办…</button>
          <button className="todo-add-icon" onClick={onAddTodo}>+</button>
        </div>
      </div>
    </div>
  )
}
