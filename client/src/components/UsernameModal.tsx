import { useState } from 'react'

interface Props {
  onConfirm: (name: string) => void
}

export function UsernameModal({ onConfirm }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = value.trim()
    if (name) onConfirm(name)
  }

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-transparent dark:border-gray-700">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#6366f1" strokeWidth="2"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">
          What's your name?
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-6">
          Your name will appear on your cursor so collaborators can see you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="e.g. Sarmad"
            value={value}
            onChange={e => setValue(e.target.value)}
            maxLength={32}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Join document
          </button>
        </form>
      </div>
    </div>
  )
}
