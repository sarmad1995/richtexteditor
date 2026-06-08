import { useRef, useState } from 'react'

export function Header() {
  const [title, setTitle] = useState('Untitled document')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitTitle = () => {
    setIsEditing(false)
    if (!title.trim()) setTitle('Untitled document')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') commitTitle()
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
        {isEditing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleKeyDown}
            className="text-sm font-semibold text-gray-800 tracking-tight bg-transparent border-b border-indigo-400 outline-none w-48"
            autoFocus
          />
        ) : (
          <span
            onClick={startEditing}
            title="Click to rename"
            className="text-sm font-semibold text-gray-800 tracking-tight cursor-text hover:text-indigo-600 transition-colors"
          >
            {title}
          </span>
        )}
      </div>
    </header>
  )
}
