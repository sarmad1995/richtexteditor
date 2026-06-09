import { useState } from 'react'

// Palette of distinct, accessible cursor colors
const COLORS = [
  '#e03131', '#2f9e44', '#1971c2', '#ae3ec9',
  '#f08c00', '#0c8599', '#d6336c', '#5c7cfa',
]

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

const NAME_KEY = 'rte_username'
const COLOR_KEY = 'rte_user_color'

export interface UserIdentity {
  name: string
  color: string
}

/**
 * Returns the current user identity and a setter.
 * Identity is persisted in localStorage so it survives page reloads.
 * Color is assigned once randomly and never changes.
 */
export function useUsername() {
  const [identity, setIdentity] = useState<UserIdentity | null>(() => {
    const name = localStorage.getItem(NAME_KEY)
    if (!name) return null
    // Retrieve or generate a stable color for this user
    const color = localStorage.getItem(COLOR_KEY) ?? randomColor()
    localStorage.setItem(COLOR_KEY, color)
    return { name, color }
  })

  const save = (name: string) => {
    const color = localStorage.getItem(COLOR_KEY) ?? randomColor()
    localStorage.setItem(NAME_KEY, name)
    localStorage.setItem(COLOR_KEY, color)
    setIdentity({ name, color })
  }

  return { identity, save }
}
