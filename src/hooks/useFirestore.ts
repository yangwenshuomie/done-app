import { useEffect, useState, useCallback } from 'react'
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Entry, Todo, MasteryGoal } from '../types'

const DEFAULT_TAGS = ['工作', '学习', '生活', '健康', '创作']

export function useFirestore(userId: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS)
  const [goals, setGoals] = useState<MasteryGoal[]>([])
  const [loadedEntries, setLoadedEntries] = useState(false)
  const [loadedTodos, setLoadedTodos] = useState(false)
  const [loadedTags, setLoadedTags] = useState(false)
  const [loadedGoals, setLoadedGoals] = useState(false)

  const loading = !loadedEntries || !loadedTodos || !loadedTags || !loadedGoals

  useEffect(() => {
    const entriesQ = query(collection(db, `users/${userId}/entries`), orderBy('ts', 'asc'))
    const todosQ = query(collection(db, `users/${userId}/todos`), orderBy('ts', 'asc'))
    const tagsRef = doc(db, `users/${userId}/config/tags`)
    const goalsRef = doc(db, `users/${userId}/config/goals`)

    const unsub1 = onSnapshot(entriesQ, snap => {
      setEntries(snap.docs.map(d => d.data() as Entry))
      setLoadedEntries(true)
    })
    const unsub2 = onSnapshot(todosQ, snap => {
      setTodos(snap.docs.map(d => d.data() as Todo))
      setLoadedTodos(true)
    })
    const unsub3 = onSnapshot(tagsRef, snap => {
      if (snap.exists()) {
        setTags((snap.data() as { list: string[] }).list)
      } else {
        setDoc(tagsRef, { list: DEFAULT_TAGS })
        setTags(DEFAULT_TAGS)
      }
      setLoadedTags(true)
    })
    const unsub4 = onSnapshot(goalsRef, snap => {
      if (snap.exists()) {
        const raw = ((snap.data() as any).list || []) as any[]
        setGoals(raw.map(g => ({ ...g, tags: g.tags ?? (g.tag ? [g.tag] : []) })))
      } else {
        setGoals([])
      }
      setLoadedGoals(true)
    })

    return () => { unsub1(); unsub2(); unsub3(); unsub4() }
  }, [userId])

  // ── Entry mutations ──────────────────────────────────────────────────────
  const addEntry = useCallback((entry: Entry) =>
    setDoc(doc(db, `users/${userId}/entries/${entry.id}`), entry), [userId])

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) =>
    setDoc(doc(db, `users/${userId}/entries/${id}`), patch, { merge: true }), [userId])

  const deleteEntry = useCallback((id: string) =>
    deleteDoc(doc(db, `users/${userId}/entries/${id}`)), [userId])

  // ── Todo mutations ───────────────────────────────────────────────────────
  const addTodo = useCallback((todo: Todo) =>
    setDoc(doc(db, `users/${userId}/todos/${todo.id}`), todo), [userId])

  const deleteTodo = useCallback((id: string) =>
    deleteDoc(doc(db, `users/${userId}/todos/${id}`)), [userId])

  // ── Tag mutations ────────────────────────────────────────────────────────
  const saveTags = useCallback((newTags: string[]) =>
    setDoc(doc(db, `users/${userId}/config/tags`), { list: newTags }), [userId])

  // ── Goal mutations ───────────────────────────────────────────────────────
  const saveGoals = useCallback((newGoals: MasteryGoal[]) =>
    setDoc(doc(db, `users/${userId}/config/goals`), { list: newGoals }), [userId])

  // ── Atomic: complete todo → create entry ─────────────────────────────────
  const completeTodo = useCallback((todoId: string, newEntry: Entry) => {
    const batch = writeBatch(db)
    batch.delete(doc(db, `users/${userId}/todos/${todoId}`))
    batch.set(doc(db, `users/${userId}/entries/${newEntry.id}`), newEntry)
    return batch.commit()
  }, [userId])

  // ── Atomic: restore entry → create todo ──────────────────────────────────
  const restoreToTodo = useCallback((entryId: string, newTodo: Todo) => {
    const batch = writeBatch(db)
    batch.delete(doc(db, `users/${userId}/entries/${entryId}`))
    batch.set(doc(db, `users/${userId}/todos/${newTodo.id}`), newTodo)
    return batch.commit()
  }, [userId])

  // ── Replace all data (backup restore) ────────────────────────────────────
  const restoreAll = useCallback((newEntries: Entry[], newTags: string[], newTodos: Todo[]) => {
    const batch = writeBatch(db)
    entries.forEach(e => batch.delete(doc(db, `users/${userId}/entries/${e.id}`)))
    todos.forEach(t => batch.delete(doc(db, `users/${userId}/todos/${t.id}`)))
    newEntries.forEach(e => batch.set(doc(db, `users/${userId}/entries/${e.id}`), e))
    newTodos.forEach(t => batch.set(doc(db, `users/${userId}/todos/${t.id}`), t))
    batch.set(doc(db, `users/${userId}/config/tags`), { list: newTags })
    return batch.commit()
  }, [userId, entries, todos])

  return {
    entries, todos, tags, goals, loading,
    addEntry, updateEntry, deleteEntry,
    addTodo, deleteTodo, saveTags, saveGoals,
    completeTodo, restoreToTodo, restoreAll,
  }
}
