import { useState, useCallback } from 'react'
import { Entry, Todo, MasteryGoal } from '../types'
import { uid, todayKey, toDateKey } from '../utils'

const DEFAULT_TAGS = ['工作', '学习', '生活', '健康', '创作']

const LS = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  },
}

function seedEntries(): Entry[] {
  const today = new Date(); today.setHours(9, 30, 0, 0)
  const yest = new Date(today); yest.setDate(yest.getDate() - 1); yest.setHours(14, 0, 0, 0)
  const yest2 = new Date(yest); yest2.setHours(10, 0, 0, 0)
  return [
    { id: uid(), text: '完成需求文档初稿', tag: '工作', duration: 5400, ts: yest2.getTime() },
    { id: uid(), text: '阅读 React 文档', tag: '学习', duration: 3600, ts: yest.getTime() },
    { id: uid(), text: '晨跑 30 分钟', tag: '健康', duration: 1800, ts: today.getTime() },
  ]
}

function seedTodos(): Todo[] {
  return [
    { id: uid(), text: '整理本周任务', tag: '工作', time: '10:00', done: false, ts: Date.now() - 1000 },
    { id: uid(), text: '看完第三章', tag: '学习', time: null, done: false, ts: Date.now() },
  ]
}

function seedGoals(): MasteryGoal[] {
  return [
    { id: uid(), name: '前端开发', tags: ['学习', '工作'] },
  ]
}

function initStore() {
  if (!localStorage.getItem('done-local-seeded')) {
    LS.set('done-local-entries', seedEntries())
    LS.set('done-local-todos', seedTodos())
    LS.set('done-local-tags', DEFAULT_TAGS)
    LS.set('done-local-goals', seedGoals())
    localStorage.setItem('done-local-seeded', '1')
  }
}

export function useLocalStore(_userId: string) {
  initStore()

  const [entries, setEntries] = useState<Entry[]>(() => LS.get('done-local-entries', []))
  const [todos, setTodos] = useState<Todo[]>(() => LS.get('done-local-todos', []))
  const [tags, setTags] = useState<string[]>(() => LS.get('done-local-tags', DEFAULT_TAGS))
  const [goals, setGoals] = useState<MasteryGoal[]>(() => LS.get('done-local-goals', []))

  const persist = useCallback(<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) => {
    LS.set(key, val); setter(val)
  }, [])

  const addEntry = useCallback((entry: Entry) => {
    const next = [...entries, entry].sort((a, b) => a.ts - b.ts)
    persist('done-local-entries', setEntries, next)
    return Promise.resolve()
  }, [entries, persist])

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    const next = entries.map(e => e.id === id ? { ...e, ...patch } : e)
    persist('done-local-entries', setEntries, next)
    return Promise.resolve()
  }, [entries, persist])

  const deleteEntry = useCallback((id: string) => {
    const next = entries.filter(e => e.id !== id)
    persist('done-local-entries', setEntries, next)
    return Promise.resolve()
  }, [entries, persist])

  const addTodo = useCallback((todo: Todo) => {
    const next = [...todos, todo]
    persist('done-local-todos', setTodos, next)
    return Promise.resolve()
  }, [todos, persist])

  const deleteTodo = useCallback((id: string) => {
    const next = todos.filter(t => t.id !== id)
    persist('done-local-todos', setTodos, next)
    return Promise.resolve()
  }, [todos, persist])

  const saveTags = useCallback((newTags: string[]) => {
    persist('done-local-tags', setTags, newTags)
    return Promise.resolve()
  }, [persist])

  const saveGoals = useCallback((newGoals: MasteryGoal[]) => {
    persist('done-local-goals', setGoals, newGoals)
    return Promise.resolve()
  }, [persist])

  const completeTodo = useCallback((todoId: string, newEntry: Entry) => {
    const nextTodos = todos.filter(t => t.id !== todoId)
    const nextEntries = [...entries, newEntry].sort((a, b) => a.ts - b.ts)
    LS.set('done-local-todos', nextTodos); setTodos(nextTodos)
    LS.set('done-local-entries', nextEntries); setEntries(nextEntries)
    return Promise.resolve()
  }, [todos, entries])

  const restoreToTodo = useCallback((entryId: string, newTodo: Todo) => {
    const nextEntries = entries.filter(e => e.id !== entryId)
    const nextTodos = [...todos, newTodo]
    LS.set('done-local-entries', nextEntries); setEntries(nextEntries)
    LS.set('done-local-todos', nextTodos); setTodos(nextTodos)
    return Promise.resolve()
  }, [entries, todos])

  const restoreAll = useCallback((newEntries: Entry[], newTags: string[], newTodos: Todo[]) => {
    LS.set('done-local-entries', newEntries); setEntries(newEntries)
    LS.set('done-local-tags', newTags); setTags(newTags)
    LS.set('done-local-todos', newTodos); setTodos(newTodos)
    return Promise.resolve()
  }, [])

  return {
    entries, todos, tags, goals, loading: false,
    addEntry, updateEntry, deleteEntry,
    addTodo, deleteTodo, saveTags, saveGoals,
    completeTodo, restoreToTodo, restoreAll,
  }
}
