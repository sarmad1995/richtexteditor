import { useRef, useState, useEffect } from 'react'
import type { UserIdentity } from '../hooks/useUsername'
import type { ConnStatus, Collaborator } from './types'

const TITLE_KEY = 'rte_doc_title'

const STATUS_CONFIG: Record<ConnStatus, { color: string; label: string; pulse: boolean }> = {
  connected:    { color: '#22c55e', label: 'Live',        pulse: true  },
  connecting:   { color: '#f59e0b', label: 'Connecting…', pulse: false },
  disconnected: { color: '#ef4444', label: 'Offline',     pulse: false },
}

interface Props {
  identity:               UserIdentity | null
  onRenameUser:           (name: string) => void
  connStatus:             ConnStatus
  isDark:                 boolean
  onToggleTheme:          () => void
  collaborators:          Collaborator[]
}

export function Header({ identity, onRenameUser, connStatus, isDark, onToggleTheme, collaborators }: Props) {
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

  const startEditingName = () => {
    // Sync nameValue to the current identity before opening the input,
    // so edits always start from the latest saved name.
    setNameValue(identity?.name ?? '')
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

      {/* Right — avatar stack + theme toggle + editable name */}
      <div className="flex items-center gap-3">

        {/* Avatar stack: peers first, then "you" at the end */}
        {identity && (
          <div className="flex items-center">
            {collaborators.slice(0, 5).map((c, i) => (
              <AvatarChip
                key={c.clientId}
                name={c.name}
                color={c.color}
                index={i}
                isYou={false}
              />
            ))}
            {collaborators.length > 5 && (
              <OverflowChip
                count={collaborators.length - 5}
                index={5}
              />
            )}
            <AvatarChip
              name={identity.name}
              color={identity.color}
              index={Math.min(collaborators.length, 5) + (collaborators.length > 5 ? 1 : 0)}
              isYou={true}
            />
          </div>
        )}

        {/* Sun / Moon toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Editable name — click to rename */}
        {identity && (
          editingName ? (
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
          )
        )}
      </div>
    </header>
  )
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface AvatarChipProps {
  name: string
  color: string
  index: number
  isYou: boolean
}

function AvatarChip({ name, color, index, isYou }: AvatarChipProps) {
  const ringClass = isYou
    ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
    : 'border-2 border-white dark:border-gray-900'

  return (
    <div
      className="relative group"
      style={{ marginLeft: index === 0 ? 0 : -8, zIndex: 10 - index }}
    >
      {/* Avatar circle */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white select-none cursor-default transition-transform duration-150 group-hover:scale-110 group-hover:z-20 ${ringClass}`}
        style={{ backgroundColor: color }}
      >
        {getInitials(name)}
      </div>

      {/* Tooltip — drops below the header so it's never clipped at the top */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-2 py-1 rounded-md shadow-lg bg-gray-900 dark:bg-gray-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
        {isYou ? `${name} (you)` : name}
      </div>
    </div>
  )
}

function OverflowChip({ count, index }: { count: number; index: number }) {
  return (
    <div
      className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 select-none cursor-default"
      style={{ marginLeft: -8, zIndex: 10 - index }}
      title={`${count} more`}
    >
      +{count}
    </div>
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
