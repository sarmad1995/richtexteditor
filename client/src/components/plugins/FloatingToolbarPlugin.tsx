import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
}

// ─── Small button used inside the floating bar ───────────────────────────────

interface FloatBtnProps {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function FloatBtn({ active, onClick, title, children }: FloatBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`
        flex items-center justify-center w-7 h-7 rounded text-xs font-medium
        transition-colors duration-100
        ${active
          ? 'bg-white/20 text-white'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'}
      `}
    >
      {children}
    </button>
  )
}

// ─── The floating bar itself (rendered via portal) ────────────────────────────

function FloatingToolbar({
  editor,
  formats,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  formats: FormatState
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Reposition after every render so the bar tracks the selection
  useEffect(() => {
    const toolbar = ref.current
    if (!toolbar) return
    const nativeSel = window.getSelection()
    if (!nativeSel || nativeSel.rangeCount === 0) return
    const range = nativeSel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    const tbRect = toolbar.getBoundingClientRect()
    const top = rect.top - tbRect.height - 8
    const left = rect.left + rect.width / 2 - tbRect.width / 2
    // Clamp to viewport edges
    toolbar.style.top = `${Math.max(8, top)}px`
    toolbar.style.left = `${Math.max(8, Math.min(left, window.innerWidth - tbRect.width - 8))}px`
  })

  const fmt = (f: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, f)

  return (
    <div
      ref={ref}
      // onMouseDown preventDefault keeps the editor selection alive when clicking buttons
      onMouseDown={e => e.preventDefault()}
      style={{ position: 'fixed' }}
      className="z-50 flex items-center gap-0.5 px-1.5 py-1 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 select-none"
    >
      <FloatBtn active={formats.bold} onClick={() => fmt('bold')} title="Bold (⌘B)">
        <strong>B</strong>
      </FloatBtn>
      <FloatBtn active={formats.italic} onClick={() => fmt('italic')} title="Italic (⌘I)">
        <em className="font-serif not-italic" style={{ fontStyle: 'italic' }}>I</em>
      </FloatBtn>
      <FloatBtn active={formats.underline} onClick={() => fmt('underline')} title="Underline (⌘U)">
        <span className="underline">U</span>
      </FloatBtn>
      <FloatBtn active={formats.strikethrough} onClick={() => fmt('strikethrough')} title="Strikethrough">
        <span className="line-through">S</span>
      </FloatBtn>
      <div className="w-px h-4 bg-gray-600 mx-0.5" />
      <FloatBtn active={formats.code} onClick={() => fmt('code')} title="Inline code">
        <CodeIcon />
      </FloatBtn>
    </div>
  )
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M4.5 3L1 7l3.5 4M9.5 3L13 7l-3.5 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Plugin (mounted inside LexicalComposer) ──────────────────────────────────

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isVisible, setIsVisible] = useState(false)
  const [formats, setFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  })

  // Reads current selection state and decides whether to show the bar
  const update = useCallback(() => {
    const selection = $getSelection()
    if (
      !$isRangeSelection(selection) ||
      selection.isCollapsed() ||
      !selection.getTextContent()
    ) {
      setIsVisible(false)
      return
    }
    setFormats({
      bold: selection.hasFormat('bold'),
      italic: selection.hasFormat('italic'),
      underline: selection.hasFormat('underline'),
      strikethrough: selection.hasFormat('strikethrough'),
      code: selection.hasFormat('code'),
    })
    setIsVisible(true)
  }, [])

  useEffect(() => {
    return mergeRegister(
      // Fires when editor content changes (covers format toggling)
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(update)
      }),
      // Fires when cursor moves without content changing (click, arrow keys)
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update()
          return false // don't consume — let other handlers run
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, update])

  if (!isVisible) return null

  return createPortal(
    <FloatingToolbar editor={editor} formats={formats} />,
    document.body,
  )
}
