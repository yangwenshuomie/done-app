export function pad(n: number): string { return String(n).padStart(2, '0') }
export function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }
export function toDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function todayKey(): string { return toDateKey(Date.now()) }
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function fmtDuration(s: number | null | undefined): string | null {
  if (!s || s <= 0) return null
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}h ${pad(m)}m`
  if (m > 0) return `${m}m ${pad(sec)}s`
  return `${sec}s`
}
export function secsToClock(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}
export function formatDateLabel(key: string): string {
  const t = todayKey(), y = toDateKey(Date.now() - 86400000)
  if (key === t) return '今天'
  if (key === y) return '昨天'
  const [, m, d] = key.split('-')
  return `${m}月${parseInt(d)}日`
}
