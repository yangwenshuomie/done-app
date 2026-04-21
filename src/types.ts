export interface Entry {
  id: string
  text: string
  tag: string | null
  duration: number | null
  ts: number
}

export interface Todo {
  id: string
  text: string
  tag: string | null
  time: string | null
  done: boolean
  ts: number
}

export interface MasteryGoal {
  id: string
  name: string
  tags: string[]
}
