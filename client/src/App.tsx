import { useState, useCallback } from 'react'
import { Editor } from './components/Editor'
import { Header } from './components/Header'
import { UsernameModal } from './components/UsernameModal'
import { useUsername } from './hooks/useUsername'
import { useTheme } from './hooks/useTheme'
import './App.css'

export type ConnStatus = 'connected' | 'connecting' | 'disconnected'

export default function App() {
  const { identity, save } = useUsername()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting')

  const handleStatusChange = useCallback((s: ConnStatus) => {
    setConnStatus(s)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
      {!identity && <UsernameModal onConfirm={save} />}

      <Header
        identity={identity}
        onRenameUser={save}
        connStatus={connStatus}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
          {identity && (
            <Editor
              username={identity.name}
              userColor={identity.color}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}
