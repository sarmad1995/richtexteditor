import { Editor } from './components/Editor'
import { Header } from './components/Header'
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <Editor />
        </div>
      </main>
    </div>
  )
}
