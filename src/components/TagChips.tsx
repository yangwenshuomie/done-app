import { useState, useRef } from 'react'

interface Props {
  tags: string[]
  selectedTag: string | null
  onSelect: (tag: string | null) => void
  onAddTag: (tagName: string) => boolean
  onDeleteTag: (tagName: string, onDone?: () => void) => void
}

export default function TagChips({ tags, selectedTag, onSelect, onAddTag, onDeleteTag }: Props) {
  const [editing, setEditing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTagVal, setNewTagVal] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (tag: string) => {
    if (editing) return
    onSelect(selectedTag === tag ? null : tag)
  }

  const handleDelete = (tag: string) => {
    onDeleteTag(tag, () => {
      if (selectedTag === tag) onSelect(null)
    })
  }

  const handleShowNew = () => {
    setEditing(false)
    setShowNew(true)
    setNewTagVal('')
    setTimeout(() => newInputRef.current?.focus(), 50)
  }

  const handleConfirmNew = () => {
    const v = newTagVal.trim()
    if (v) {
      const added = onAddTag(v)
      if (added !== false) onSelect(v)
    }
    setShowNew(false)
    setNewTagVal('')
  }

  const handleCancelNew = () => {
    setShowNew(false)
    setNewTagVal('')
  }

  return (
    <div>
      <div className={`tag-chips${editing ? ' editing' : ''}`}>
        {tags.map(tag => (
          <span key={tag} className="chip-wrap">
            <button
              className={`chip${selectedTag === tag ? ' selected' : ''}`}
              onClick={() => handleSelect(tag)}
            >
              {tag}
            </button>
            <button
              className="chip-del"
              onClick={(e) => { e.stopPropagation(); handleDelete(tag) }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="chip-actions">
        <button className="chip-btn" onClick={handleShowNew}>＋ 添加</button>
        <button
          className={`chip-btn${editing ? ' active' : ''}`}
          onClick={() => { setEditing(e => !e); if (editing) setShowNew(false) }}
        >
          编辑
        </button>
      </div>

      <div className={`chip-new-row${showNew ? ' visible' : ''}`}>
        <input
          ref={newInputRef}
          className="chip-new-input"
          placeholder="分类名称"
          maxLength={12}
          value={newTagVal}
          onChange={e => setNewTagVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleConfirmNew()
            if (e.key === 'Escape') handleCancelNew()
          }}
        />
        <button className="chip-new-confirm" onClick={handleConfirmNew}>确认</button>
        <button className="chip-new-cancel" onClick={handleCancelNew}>×</button>
      </div>
    </div>
  )
}
