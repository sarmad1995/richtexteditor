/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isParagraphNode,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type LexicalEditor,
} from 'lexical'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'
import { $createListNode, $createListItemNode } from '@lexical/list'
import { $setBlocksType } from '@lexical/selection'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { $createDrawingNode } from '../nodes/DrawingNode'

// ─── Command catalogue ────────────────────────────────────────────────────────

interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
  keywords: string[]
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h1', label: 'Heading 1', description: 'Large section heading',
    icon: 'H1', keywords: ['h1', 'heading', 'title'],
  },
  {
    id: 'h2', label: 'Heading 2', description: 'Medium section heading',
    icon: 'H2', keywords: ['h2', 'heading'],
  },
  {
    id: 'h3', label: 'Heading 3', description: 'Small section heading',
    icon: 'H3', keywords: ['h3', 'heading'],
  },
  {
    id: 'bullet', label: 'Bullet List', description: 'Unordered list',
    icon: '•', keywords: ['bullet', 'list', 'ul', 'unordered'],
  },
  {
    id: 'number', label: 'Numbered List', description: 'Ordered list',
    icon: '1.', keywords: ['number', 'numbered', 'ol', 'ordered', 'list'],
  },
  {
    id: 'quote', label: 'Quote', description: 'Block quotation',
    icon: '"', keywords: ['quote', 'blockquote'],
  },
  {
    id: 'code', label: 'Code Block', description: 'Syntax-highlighted code',
    icon: '</>', keywords: ['code', 'codeblock', 'pre'],
  },
  {
    id: 'drawing', label: 'Drawing', description: 'Excalidraw canvas',
    icon: '✏', keywords: ['draw', 'drawing', 'canvas', 'sketch', 'excalidraw'],
  },
]

function getFiltered(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS
  const q = query.toLowerCase()
  return SLASH_COMMANDS.filter(
    cmd => cmd.keywords.some(k => k.includes(q)) || cmd.label.toLowerCase().includes(q),
  )
}

// ─── Command execution ────────────────────────────────────────────────────────

function applySlashCommand(editor: LexicalEditor, commandId: string): void {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    const anchor = selection.anchor
    const anchorNode = anchor.getNode()
    if (!$isTextNode(anchorNode)) return

    // 1. Select the "/" + query text and delete it
    const offset = anchor.offset
    anchorNode.select(0, offset)
    const sel = $getSelection()
    if (!$isRangeSelection(sel)) return
    sel.insertText('')

    // 2. Get the refreshed selection + parent paragraph after deletion
    const freshSel = $getSelection()
    if (!$isRangeSelection(freshSel)) return
    const freshNode = freshSel.anchor.getNode()
    const parent = $isTextNode(freshNode) ? freshNode.getParent() : freshNode

    // 3. Apply the transformation
    switch (commandId) {
      case 'h1':
      case 'h2':
      case 'h3':
        $setBlocksType(freshSel, () => $createHeadingNode(commandId))
        break

      case 'quote':
        $setBlocksType(freshSel, () => $createQuoteNode())
        break

      case 'code':
        $setBlocksType(freshSel, () => $createCodeNode())
        break

      case 'bullet': {
        if ($isParagraphNode(parent)) {
          const list = $createListNode('bullet')
          const item = $createListItemNode()
          list.append(item)
          parent.replace(list)
          item.select()
        }
        break
      }

      case 'number': {
        if ($isParagraphNode(parent)) {
          const list = $createListNode('number')
          const item = $createListItemNode()
          list.append(item)
          parent.replace(list)
          item.select()
        }
        break
      }

      case 'drawing':
        $insertNodeToNearestRoot($createDrawingNode())
        break
    }
  })
}

// ─── Menu component (rendered via portal) ────────────────────────────────────

interface SlashMenuProps {
  commands: SlashCommand[]
  selectedIndex: number
  onSelect: (id: string) => void
}

function SlashCommandMenu({ commands, selectedIndex, onSelect }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Reposition below the caret on every render
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const nativeSel = window.getSelection()
    if (!nativeSel || nativeSel.rangeCount === 0) return
    const range = nativeSel.getRangeAt(0)
    const caretRect = range.getBoundingClientRect()

    let top = caretRect.bottom + 8
    let left = caretRect.left

    // Clamp after we know the menu's rendered size
    const menuRect = menu.getBoundingClientRect()
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - menuRect.width - 8
    }
    if (top + menuRect.height > window.innerHeight - 8) {
      // Flip above the caret if not enough room below
      top = caretRect.top - menuRect.height - 4
    }
    menu.style.top = `${Math.max(8, top)}px`
    menu.style.left = `${Math.max(8, left)}px`
  })

  // Scroll the highlighted item into view when selection changes
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed' }}
      // Prevent the editor from losing focus when interacting with the menu
      onMouseDown={e => e.preventDefault()}
      className="z-50 w-60 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      <div className="py-1 max-h-72 overflow-y-auto">
        {commands.map((cmd, i) => (
          <button
            key={cmd.id}
            ref={i === selectedIndex ? selectedRef : null}
            type="button"
            onClick={() => onSelect(cmd.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left
              transition-colors duration-75
              ${i === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'}
            `}
          >
            <span className={`
              flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0
              ${i === selectedIndex
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600'}
            `}>
              {cmd.icon}
            </span>
            <div>
              <div className={`text-sm font-medium ${
                i === selectedIndex ? 'text-indigo-700' : 'text-gray-800'
              }`}>
                {cmd.label}
              </div>
              <div className="text-xs text-gray-400">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Plugin (mounted inside LexicalComposer) ──────────────────────────────────

interface MenuState {
  query: string
  selectedIndex: number
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext()
  const [menuState, setMenuState] = useState<MenuState | null>(null)

  // ── Detect "/" at the start of a paragraph ──────────────────────────────────
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()

        // Need a collapsed (cursor-only) selection inside a paragraph
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setMenuState(null)
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()

        if (!$isTextNode(node)) {
          setMenuState(null)
          return
        }

        // Only trigger inside a top-level paragraph (not inside a list item, etc.)
        if (!$isParagraphNode(node.getParent())) {
          setMenuState(null)
          return
        }

        // Make sure this is the first (or only) text node in the paragraph
        if (node.getPreviousSibling() !== null) {
          setMenuState(null)
          return
        }

        const textBefore = node.getTextContent().slice(0, anchor.offset)

        if (!textBefore.startsWith('/')) {
          setMenuState(null)
          return
        }

        const query = textBefore.slice(1)

        // Close if no commands match the current query
        if (query && getFiltered(query).length === 0) {
          setMenuState(null)
          return
        }

        // Preserve selectedIndex when only query length changed (keeps highlight stable)
        setMenuState(prev =>
          prev && prev.query === query ? prev : { query, selectedIndex: 0 },
        )
      })
    })
  }, [editor])

  // ── Keyboard navigation (only when the menu is open) ─────────────────────────
  useEffect(() => {
    if (!menuState) return

    const filtered = getFiltered(menuState.query)

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        e => {
          e?.preventDefault()
          setMenuState(prev =>
            prev
              ? { ...prev, selectedIndex: Math.min(prev.selectedIndex + 1, filtered.length - 1) }
              : null,
          )
          return true // consumed — don't move cursor
        },
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        e => {
          e?.preventDefault()
          setMenuState(prev =>
            prev
              ? { ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) }
              : null,
          )
          return true
        },
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        e => {
          e?.preventDefault()
          const cmd = filtered[menuState.selectedIndex]
          if (cmd) {
            setMenuState(null)
            applySlashCommand(editor, cmd.id)
          }
          return true // consumed — don't insert a new line
        },
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          setMenuState(null)
          return true // consumed
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, menuState])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!menuState) return null

  const filtered = getFiltered(menuState.query)
  if (filtered.length === 0) return null

  const safeIndex = Math.min(menuState.selectedIndex, filtered.length - 1)

  return createPortal(
    <SlashCommandMenu
      commands={filtered}
      selectedIndex={safeIndex}
      onSelect={id => {
        setMenuState(null)
        applySlashCommand(editor, id)
      }}
    />,
    document.body,
  )
}
