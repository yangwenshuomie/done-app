import { useRef } from 'react'
import { Entry } from '../types'
import { Todo } from '../types'

interface BackupData {
  version?: number
  entries: Entry[]
  tags: string[]
  todos: Todo[]
}

interface Props {
  open: boolean
  onClose: () => void
  onBackup: () => void
  onRestore: (data: BackupData) => void
  onExportWidget: () => void
  onLogOut: () => void
}

export default function AppMenu({ open, onClose, onBackup, onRestore, onExportWidget, onLogOut }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData
        if (!Array.isArray(data.entries)) throw new Error('invalid')
        onRestore(data)
      } catch {
        alert('文件格式不正确，请选择 Done 导出的备份文件')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div
        className={`app-menu-overlay${open ? ' open' : ''}`}
        onClick={onClose}
      />
      <div className={`app-menu${open ? ' open' : ''}`}>
        <div className="app-menu-handle" />
        <div className="app-menu-title">数据管理</div>

        <button className="app-menu-item" onClick={() => { onClose(); onBackup() }}>
          <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div className="app-menu-item-body">
            <div>备份数据</div>
            <div className="item-desc">导出完整备份到文件</div>
          </div>
        </button>

        <button className="app-menu-item" onClick={() => { onClose(); fileInputRef.current?.click() }}>
          <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 14 12 9 17 14"/>
            <line x1="12" y1="9" x2="12" y2="21"/>
          </svg>
          <div className="app-menu-item-body">
            <div>从备份恢复</div>
            <div className="item-desc">从之前导出的备份文件恢复</div>
          </div>
        </button>

        <button className="app-menu-item" onClick={() => { onClose(); onExportWidget() }}>
          <svg viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <div className="app-menu-item-body">
            <div>导出 Widget 数据</div>
            <div className="item-desc">更新 Scriptable 小组件的数据</div>
          </div>
        </button>

        <button className="app-menu-item" onClick={onLogOut}>
          <svg viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <div className="app-menu-item-body">
            <div>退出登录</div>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleRestoreFile}
      />
    </>
  )
}
