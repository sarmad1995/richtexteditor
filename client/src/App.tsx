import { useState, useCallback } from 'react'
import { Editor } from './components/Editor'
import { Header } from './components/Header'
import { UsernameModal } from './components/UsernameModal'
import { useUsername } from './hooks/useUsername'
import './App.css'

export type ConnStatus = 'connected' | 'connecting' | 'disconnected'

export default function App() {
  const { identity, save } = useUsername()
  // Starts as 'connecting'; Editor updates this via the Yjs provider events
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting')

  const handleStatusChange = useCallback((s: ConnStatus) => {
    setConnStatus(s)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!identity && <UsernameModal onConfirm={save} />}

      <Header identity={identity} onRenameUser={save} connStatus={connStatus} />

      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
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
