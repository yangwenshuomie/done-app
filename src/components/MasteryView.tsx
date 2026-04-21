import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Entry, MasteryGoal } from '../types'

const CAT_COLORS = ['#5b8ef0', '#f07b5b', '#5bbf8e', '#c97de8', '#e8c45b', '#5bcce8', '#e85b8e', '#8eb85b']

function goalColor(index: number) {
  return CAT_COLORS[index % CAT_COLORS.length]
}

interface Props {
  entries: Entry[]
  tags: string[]
  goals: MasteryGoal[]
  onGoalsChange: (goals: MasteryGoal[]) => void
}

interface SheetState {
  mode: 'add' | 'edit'
  goalId?: string
  name: string
  tags: string[]
}

const CELL = 26, GAP = 4, COL_W = CELL + GAP

interface CardProps {
  goal: MasteryGoal
  idx: number
  entries: Entry[]
  onEdit: () => void
  onDelete: () => void
}

function MasteryCard({ goal, idx, entries, onEdit, onDelete }: CardProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0 })

  const totalSecs = entries
    .filter(e => e.tag !== null && goal.tags.includes(e.tag))
    .reduce((s, e) => s + (e.duration ?? 0), 0)
  const filledCells = Math.min(Math.floor(totalSecs / 36000), 1000)
  const partialPct = Math.round((totalSecs % 36000) / 36000 * 100)
  const hours = Math.floor(totalSecs / 3600)
  const color = goalColor(idx)

  useEffect(() => {
    if (!gridRef.current) return
    const currentCol = Math.floor(filledCells / 2)
    gridRef.current.scrollLeft = Math.max(0, (currentCol - 1) * COL_W)
  }, [filledCells])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, startX: e.clientX, startScroll: gridRef.current!.scrollLeft }
    gridRef.current!.setPointerCapture(e.pointerId)
    gridRef.current!.classList.add('dragging')
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    gridRef.current!.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX)
  }

  const onPointerUp = () => {
    drag.current.active = false
    gridRef.current?.classList.remove('dragging')
  }

  return (
    <div className="mastery-card">
      <div className="mastery-card-header">
        <span className="mastery-card-name">{goal.name}</span>
        <div className="mastery-card-actions">
          <button className="mastery-action-btn" onClick={onEdit}>✎</button>
          <button className="mastery-action-btn" onClick={onDelete}>×</button>
        </div>
      </div>
      <div className="mastery-tag-label">分类：{goal.tags.join('、')}</div>
      <div
        className="mastery-grid"
        ref={gridRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {Array.from({ length: 1000 }, (_, j) => {
          if (j < filledCells) {
            return <div key={j} className="mastery-cell" style={{ background: color }} />
          }
          if (j === filledCells && partialPct > 0) {
            return (
              <div
                key={j}
                className="mastery-cell mastery-cell-partial"
                style={{
                  background: `linear-gradient(to top, ${color} ${partialPct}%, var(--surface) ${partialPct}%)`,
                  boxShadow: `inset 0 0 0 1.5px ${color}55`,
                }}
              />
            )
          }
          return <div key={j} className="mastery-cell mastery-cell-empty" />
        })}
      </div>
      <div className="mastery-progress">{hours}h 已记录 · {filledCells}/1000 格</div>
      <div className="mastery-remaining">距精通还差 {Math.max(0, 10000 - hours)} 小时</div>
    </div>
  )
}

export default function MasteryView({ entries, tags, goals, onGoalsChange }: Props) {
  const [sheet, setSheet] = useState<SheetState | null>(null)

  const openAdd = () => {
    setSheet({ mode: 'add', name: '', tags: [] })
  }

  const openEdit = (goal: MasteryGoal) => {
    setSheet({ mode: 'edit', goalId: goal.id, name: goal.name, tags: [...goal.tags] })
  }

  const closeSheet = () => setSheet(null)

  const toggleTag = (tag: string) => {
    setSheet(s => {
      if (!s) return s
      const has = s.tags.includes(tag)
      return { ...s, tags: has ? s.tags.filter(t => t !== tag) : [...s.tags, tag] }
    })
  }

  const handleSave = () => {
    if (!sheet || sheet.tags.length === 0) return
    if (sheet.mode === 'add') {
      const newGoal: MasteryGoal = {
        id: String(Date.now()),
        name: sheet.name.trim() || sheet.tags.join('、'),
        tags: sheet.tags,
      }
      onGoalsChange([...goals, newGoal])
    } else {
      onGoalsChange(goals.map(g =>
        g.id === sheet.goalId
          ? { ...g, name: sheet.name.trim() || sheet.tags.join('、'), tags: sheet.tags }
          : g
      ))
    }
    closeSheet()
  }

  const handleDelete = (id: string) => {
    onGoalsChange(goals.filter(g => g.id !== id))
  }

  return (
    <div className="mastery-page">
      <div className="mastery-page-header">
        <span className="mastery-page-title">精通</span>
        {goals.length < 5 && (
          <button className="mastery-add-btn" onClick={openAdd}>＋</button>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="mastery-empty">
          <div className="mastery-empty-icon">🎯</div>
          <div className="mastery-empty-text">设定目标，追踪精通之路</div>
          <button className="mastery-add-btn" onClick={openAdd} style={{ margin: '0 auto' }}>＋</button>
        </div>
      ) : (
        goals.map((goal, idx) => (
          <MasteryCard
            key={goal.id}
            goal={goal}
            idx={idx}
            entries={entries}
            onEdit={() => openEdit(goal)}
            onDelete={() => handleDelete(goal.id)}
          />
        ))
      )}

      {sheet && createPortal(
        <>
          <div className="sheet-overlay open" onClick={closeSheet} />
          <div className="sheet open">
            <div className="sheet-handle" />
            <div className="sheet-title">{sheet.mode === 'add' ? '新增目标' : '编辑目标'}</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                目标名称
              </label>
              <input
                className="sheet-input"
                value={sheet.name}
                onChange={e => setSheet(s => s ? { ...s, name: e.target.value } : s)}
                placeholder="目标名称"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                绑定分类（可多选）
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(tag => {
                  const selected = sheet.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--line)'}`,
                        background: selected ? 'var(--ink)' : 'none',
                        color: selected ? 'var(--bg)' : 'var(--ink)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'var(--font)',
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={sheet.tags.length === 0}
              style={{
                width: '100%', padding: 14,
                background: sheet.tags.length > 0 ? 'var(--ink)' : 'var(--line)',
                color: sheet.tags.length > 0 ? 'var(--bg)' : 'var(--ink-3)',
                border: 'none', borderRadius: 14,
                fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500,
                cursor: sheet.tags.length > 0 ? 'pointer' : 'default',
              }}
            >
              确认
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
