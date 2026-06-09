import { useRef, useState, useEffect } from 'react'
import type { UserIdentity } from '../hooks/useUsername'

const TITLE_KEY = 'rte_doc_title'

interface Props {
  identity: UserIdentity | null
  onRenameUser: (name: string) => void
}

export function Header({ identity, onRenameUser }: Props) {
  // ── Document title ────────────────────────────────────────────────────────
  const [title, setTitle] = useState(() => localStorage.getItem(TITLE_KEY) ?? 'Untitled document')
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(TITLE_KEY, title)
  }, [title])

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

  useEffect(() => {
    if (identity?.name) setNameValue(identity.name)
  }, [identity?.name])

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
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
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
            className="text-sm font-semibold text-gray-800 tracking-tight bg-transparent border-b border-indigo-400 outline-none w-48"
            autoFocus
          />
        ) : (
          <span
            onClick={startEditingTitle}
            title="Click to rename document"
            className="text-sm font-semibold text-gray-800 tracking-tight cursor-text hover:text-indigo-600 transition-colors"
          >
            {title}
          </span>
        )}
      </div>

      {/* Right — username chip (hidden until identity is set) */}
      {identity && (
        <div className="flex items-center gap-2">
          {/* Colored dot matches this user's cursor color */}
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: identity.color }}
          />
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKey}
              maxLength={32}
              className="text-sm text-gray-700 bg-transparent border-b border-indigo-400 outline-none w-28"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              title="Click to change your name"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors group"
            >
              <span>{identity.name}</span>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className="opacity-0 group-hover:opacity-60 transition-opacity"
              >
                <path
                  d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z"
                  stroke="currentColor" strokeWidth="1.2"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </header>
  )
}
