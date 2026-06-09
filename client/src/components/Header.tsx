import { useRef, useState, useEffect } from 'react'
import type { UserIdentity } from '../hooks/useUsername'
import type { ConnStatus } from '../App'

const TITLE_KEY = 'rte_doc_title'

const STATUS_CONFIG: Record<ConnStatus, { color: string; label: string; pulse: boolean }> = {
  connected:    { color: '#22c55e', label: 'Live',        pulse: true  },
  connecting:   { color: '#f59e0b', label: 'Connecting…', pulse: false },
  disconnected: { color: '#ef4444', label: 'Offline',     pulse: false },
}

interface Props {
  identity:      UserIdentity | null
  onRenameUser:  (name: string) => void
  connStatus:    ConnStatus
  isDark:        boolean
  onToggleTheme: () => void
}

export function Header({ identity, onRenameUser, connStatus, isDark, onToggleTheme }: Props) {
  const st = STATUS_CONFIG[connStatus]

  // ── Document title ────────────────────────────────────────────────────────
  const [title, setTitle] = useState(() => localStorage.getItem(TITLE_KEY) ?? 'Untitled document')
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { localStorage.setItem(TITLE_KEY, title) }, [title])

  const startEditingTitle = () => {
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 0)
  }
  const commitTitle = () => {
    setEditingTitle(false)
    if (!title.trim()) setTitle('Untitled document')
  }
  const handleTitleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') commitTitle()
  }

  // ── Username ──────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(identity?.name ?? '')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (identity?.name) setNameValue(identity.name) }, [identity?.name])

  const startEditingName = () => {
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }
  const commitName = () => {
    setEditingName(false)
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== identity?.name) onRenameUser(trimmed)
    else if (!trimmed) setNameValue(identity?.name ?? '')
  }
  const handleNameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') commitName()
  }

  return (
    <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">

      {/* Left — document title */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKey}
            className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight bg-transparent border-b border-indigo-400 outline-none w-48"
            autoFocus
          />
        ) : (
          <span
            onClick={startEditingTitle}
            title="Click to rename document"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {title}
          </span>
        )}
      </div>

      {/* Centre — connection status */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
        <span className="relative flex h-2 w-2">
          {st.pulse && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: st.color }}
            />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: st.color }} />
        </span>
        <span>{st.label}</span>
      </div>

      {/* Right — theme toggle + username */}
      <div className="flex items-center gap-3">
        {/* Sun / Moon toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Username chip */}
        {identity && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: identity.color }} />
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKey}
                maxLength={32}
                className="text-sm text-gray-700 dark:text-gray-200 bg-transparent border-b border-indigo-400 outline-none w-28"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startEditingName}
                title="Click to change your name"
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <span>{identity.name}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className="opacity-0 group-hover:opacity-60 transition-opacity">
                  <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l1.41-1.41M3.05 12.95l1.41-1.41"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 100 11 5.5 5.5 0 007-4z"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
