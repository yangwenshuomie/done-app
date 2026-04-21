import { useState, useRef, useCallback } from 'react'
import { toDateKey, uid as genId, todayKey, pad } from './utils'

function shiftDateKey(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
import Header from './components/Header'
import DateStrip from './components/DateStrip'
import ScheduleView from './components/ScheduleView'
import StatsView from './components/StatsView'
import BottomNav from './components/BottomNav'
import MasteryView from './components/MasteryView'
import DoneSheet from './components/DoneSheet'
import TodoSheet from './components/TodoSheet'
import CalendarPicker from './components/CalendarPicker'
import AppMenu from './components/AppMenu'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { useFirestore } from './hooks/useFirestore'
import { useLocalStore } from './hooks/useLocalStore'
import { Entry, Todo, MasteryGoal } from './types'

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true'

interface ConfirmState {
  msg: string
  onOk: () => void
  okLabel: string
  danger: boolean
}

export default function App() {
  if (LOCAL_MODE) return <AppContent userId="local" onLogOut={() => {}} />

  const { user, signIn, logOut } = useAuth()

  if (user === undefined) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: '14px' }}>Loading…</div>
      </div>
    )
  }

  if (user === null) return <LoginScreen onSignIn={signIn} />

  return <AppContent userId={user.uid} onLogOut={logOut} />
}

function AppContent({ userId, onLogOut }: { userId: string; onLogOut: () => void }) {
  const useStore = LOCAL_MODE ? useLocalStore : useFirestore
  const {
    entries, todos, tags, goals, loading,
    addEntry, updateEntry, deleteEntry,
    addTodo, deleteTodo, saveTags, saveGoals,
    completeTodo, restoreToTodo, restoreAll,
  } = useStore(userId)

  const [curTab, setCurTab] = useState<'schedule' | 'stats' | 'mastery'>('schedule')
  const [schedDate, setSchedDate] = useState(todayKey())
  const [doneSheetOpen, setDoneSheetOpen] = useState(false)
  const [doneSheetEntryId, setDoneSheetEntryId] = useState<string | null>(null)
  const [todoSheetOpen, setTodoSheetOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2500)
  }, [])

  const showConfirm = useCallback((msg: string, onOk: () => void, okLabel = '确定', danger = true) => {
    setConfirmState({ msg, onOk, okLabel, danger })
  }, [])

  // ── Entry mutations ──────────────────────────────────────────────────────
  const handleDeleteEntry = useCallback((id: string) => {
    showConfirm('删除这条记录？', () => deleteEntry(id))
  }, [deleteEntry, showConfirm])

  const handleRestoreEntry = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    restoreToTodo(id, { id: genId(), text: entry.text, tag: entry.tag, time: null, done: false, ts: Date.now() })
  }, [entries, restoreToTodo])

  // ── Todo mutations ───────────────────────────────────────────────────────
  const handleCompleteTodo = useCallback((id: string) => {
    const t = todos.find(x => x.id === id)
    if (!t) return
    let ts: number
    if (t.time) {
      const [h, m] = t.time.split(':').map(Number)
      const d = new Date(schedDate + 'T00:00:00')
      d.setHours(h, m, 0, 0)
      ts = d.getTime()
    } else {
      const d = new Date(schedDate + 'T00:00:00')
      const now = new Date()
      d.setHours(now.getHours(), now.getMinutes(), 0, 0)
      ts = d.getTime()
    }
    completeTodo(id, { id: genId(), text: t.text, tag: t.tag, duration: null, ts })
  }, [todos, schedDate, completeTodo])

  // ── Tag mutations ────────────────────────────────────────────────────────
  const handleAddTag = useCallback((tagName: string): boolean => {
    if (!tagName || tags.includes(tagName)) return false
    saveTags([...tags, tagName])
    return true
  }, [tags, saveTags])

  const handleDeleteTag = useCallback((tagName: string, onDone?: () => void) => {
    const n = entries.filter(e => e.tag === tagName).length
    const msg = n
      ? `删除"${tagName}"？\n该分类有 ${n} 条记录，删除后变为未分类。`
      : `删除分类"${tagName}"？`
    showConfirm(msg, () => {
      saveTags(tags.filter(t => t !== tagName))
      if (onDone) onDone()
    })
  }, [tags, entries, saveTags, showConfirm])

  // ── Backup / Restore ─────────────────────────────────────────────────────
  const backupData = useCallback(() => {
    const d = new Date()
    const blob = new Blob(
      [JSON.stringify({ version: 1, backupAt: Date.now(), entries, tags, todos })],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `done-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('备份已导出')
  }, [entries, tags, todos, showToast])

  const handleGoalsChange = useCallback((newGoals: MasteryGoal[]) => {
    saveGoals(newGoals)
  }, [saveGoals])

  const restoreData = useCallback((data: { entries: Entry[]; tags: string[]; todos: Todo[] }) => {
    const newEntries = data.entries || []
    const newTags = data.tags || ['工作', '学习', '生活', '健康', '创作']
    const newTodos = data.todos || []
    showConfirm(
      `备份包含 ${newEntries.length} 条记录、${newTodos.length} 条待办。\n恢复后当前数据将被替换，确定吗？`,
      () => restoreAll(newEntries, newTags, newTodos).then(() => showToast(`已恢复 ${newEntries.length} 条记录 ✓`)),
      '恢复', false
    )
  }, [restoreAll, showToast, showConfirm])

  const exportWidget = useCallback(() => {
    const tKey = todayKey()
    let streak = 0
    const cursor = new Date()
    while (entries.some(e => toDateKey(e.ts) === toDateKey(cursor.getTime()))) {
      streak++; cursor.setDate(cursor.getDate() - 1)
    }
    const payload = {
      exportedAt: Date.now(),
      todayCount: entries.filter(e => toDateKey(e.ts) === tKey).length,
      totalCount: entries.length,
      streak,
      todos: todos.filter(t => !t.done).map(t => ({ id: t.id, text: t.text, tag: t.tag ?? null, time: t.time ?? null, done: false })),
      recent: [...entries].sort((a, b) => b.ts - a.ts).slice(0, 5).map(e => ({ text: e.text, tag: e.tag ?? null, date: toDateKey(e.ts) })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'done-widget.json'; a.click()
    URL.revokeObjectURL(url)
    showToast('Widget 数据已导出')
  }, [entries, todos, showToast])

  const openDoneSheet = useCallback((entryId: string | null) => {
    setDoneSheetEntryId(entryId)
    setDoneSheetOpen(true)
  }, [])

  const closeDoneSheet = useCallback(() => {
    setDoneSheetOpen(false)
    setDoneSheetEntryId(null)
  }, [])

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: '14px' }}>Loading…</div>
      </div>
    )
  }

  const todayCount = entries.filter(e => toDateKey(e.ts) === todayKey()).length

  return (
    <div className="app">
      <Header
        todayCount={todayCount}
        totalCount={entries.length}
        onMenuOpen={() => setAppMenuOpen(true)}
      />

      {curTab === 'schedule' && (
        <DateStrip
          schedDate={schedDate}
          entries={entries}
          onSelectDate={setSchedDate}
          onCalOpen={() => setCalOpen(true)}
        />
      )}

      {curTab === 'schedule' && (
        <ScheduleView
          schedDate={schedDate}
          entries={entries}
          todos={todos}
          onDeleteEntry={handleDeleteEntry}
          onRestoreEntry={handleRestoreEntry}
          onEditEntry={(id) => openDoneSheet(id)}
          onCompleteTodo={handleCompleteTodo}
          onDeleteTodo={deleteTodo}
          onAddTodo={() => setTodoSheetOpen(true)}
          onPrevDay={() => setSchedDate(d => shiftDateKey(d, -1))}
          onNextDay={() => setSchedDate(d => shiftDateKey(d, 1))}
        />
      )}
      {curTab === 'stats' && <StatsView entries={entries} />}
      {curTab === 'mastery' && (
        <MasteryView
          entries={entries}
          tags={tags}
          goals={goals}
          onGoalsChange={handleGoalsChange}
        />
      )}

      <BottomNav
        curTab={curTab}
        onTabChange={setCurTab}
        onFabClick={() => openDoneSheet(null)}
      />

      <DoneSheet
        open={doneSheetOpen}
        entryId={doneSheetEntryId}
        entries={entries}
        tags={tags}
        schedDate={schedDate}
        onClose={closeDoneSheet}
        onSave={(entry, isEdit) => {
          if (isEdit) {
            updateEntry(entry.id, entry)
          } else {
            addEntry(entry)
          }
          closeDoneSheet()
          showToast(isEdit ? '已更新' : '已记录 ✓')
        }}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
        showToast={showToast}
      />

      <TodoSheet
        open={todoSheetOpen}
        tags={tags}
        onClose={() => setTodoSheetOpen(false)}
        onSave={(todo) => { addTodo(todo); setTodoSheetOpen(false) }}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
      />

      {calOpen && (
        <CalendarPicker
          schedDate={schedDate}
          entries={entries}
          onConfirm={(date) => { setSchedDate(date); setCalOpen(false) }}
          onClose={() => setCalOpen(false)}
        />
      )}

      <AppMenu
        open={appMenuOpen}
        onClose={() => setAppMenuOpen(false)}
        onBackup={backupData}
        onRestore={restoreData}
        onExportWidget={exportWidget}
        onLogOut={() => { setAppMenuOpen(false); onLogOut() }}
      />

      <Toast msg={toastMsg} />

      {confirmState && (
        <ConfirmDialog
          msg={confirmState.msg}
          okLabel={confirmState.okLabel}
          danger={confirmState.danger}
          onOk={() => { confirmState.onOk(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
