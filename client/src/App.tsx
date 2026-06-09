import { Editor } from './components/Editor'
import { Header } from './components/Header'
import { UsernameModal } from './components/UsernameModal'
import { useUsername } from './hooks/useUsername'
import './App.css'

export default function App() {
  const { identity, save } = useUsername()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Show modal on first visit (no username saved yet) */}
      {!identity && <UsernameModal onConfirm={save} />}

      <Header identity={identity} onRenameUser={save} />

      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Only mount the editor once we have an identity */}
          {identity && <Editor username={identity.name} userColor={identity.color} />}
        </div>
      </main>
    </div>
  )
}
