import { useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
} from 'lexical'
import { $createHeadingNode } from '@lexical/rich-text'
import type { HeadingTagType } from '@lexical/rich-text'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { $setBlocksType } from '@lexical/selection'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $createDrawingNode } from './nodes/DrawingNode'
import type { BlockType, ToolbarState } from './types'

interface ToolbarProps {
  state: ToolbarState
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
}

interface ToolbarButtonProps {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`
        flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium
        transition-colors duration-100 cursor-pointer select-none
        ${active
          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }
      `}
    >
      {children}
    </button>
  )
}

export function Toolbar({ state }: ToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const { isBold, isItalic, isUnderline, isStrikethrough, blockType } = state

  const formatText = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    [editor],
  )

  const insertDrawing = useCallback(() => {
    editor.update(() => {
      $insertNodeToNearestRoot($createDrawingNode())
    })
  }, [editor])

  const setBlockType = useCallback(
    (type: BlockType) => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        if (type === 'bullet') {
          editor.dispatchCommand(
            blockType === 'bullet' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
            undefined,
          )
        } else if (type === 'number') {
          editor.dispatchCommand(
            blockType === 'number' ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
            undefined,
          )
        } else if (type === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode())
        } else {
          const tag = type as HeadingTagType
          if (blockType === type) {
            $setBlocksType(selection, () => $createParagraphNode())
          } else {
            $setBlocksType(selection, () => $createHeadingNode(tag))
          }
        }
      })
    },
    [editor, blockType],
  )

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-wrap transition-colors duration-200">
      <ToolbarButton active={isBold} onClick={() => formatText('bold')} title="Bold (⌘B)">
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton active={isItalic} onClick={() => formatText('italic')} title="Italic (⌘I)">
        <span className="italic font-serif">I</span>
      </ToolbarButton>
      <ToolbarButton active={isUnderline} onClick={() => formatText('underline')} title="Underline (⌘U)">
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton active={isStrikethrough} onClick={() => formatText('strikethrough')} title="Strikethrough">
        <span className="line-through">S</span>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton active={blockType === 'h1'} onClick={() => setBlockType('h1')} title="Heading 1">
        <span className="text-xs font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton active={blockType === 'h2'} onClick={() => setBlockType('h2')} title="Heading 2">
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton active={blockType === 'h3'} onClick={() => setBlockType('h3')} title="Heading 3">
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>
      <ToolbarButton active={blockType === 'paragraph'} onClick={() => setBlockType('paragraph')} title="Normal text">
        <span className="text-xs">¶</span>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton active={blockType === 'bullet'} onClick={() => setBlockType('bullet')} title="Bullet list">
        <ListBulletIcon />
      </ToolbarButton>
      <ToolbarButton active={blockType === 'number'} onClick={() => setBlockType('number')} title="Numbered list">
        <ListNumberIcon />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton active={false} onClick={insertDrawing} title="Insert drawing canvas">
        <DrawingIcon />
      </ToolbarButton>
    </div>
  )
}

function ListBulletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="2.5" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1.5" fill="currentColor" />
      <circle cx="2.5" cy="11.5" r="1.5" fill="currentColor" />
      <rect x="6" y="3.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="6" y="7.25" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="6" y="10.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

function ListNumberIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <text x="1" y="5.5" fontSize="5" fontWeight="bold" fill="currentColor">1.</text>
      <text x="1" y="9" fontSize="5" fontWeight="bold" fill="currentColor">2.</text>
      <text x="1" y="12.5" fontSize="5" fontWeight="bold" fill="currentColor">3.</text>
      <rect x="6" y="3.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="6" y="7.25" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="6" y="10.75" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

function DrawingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13.5C2 13.5 4 12 6 10C8 8 9 6 10.5 5C12 4 13.5 4.5 13.5 6C13.5 7.5 12 8 11 8.5C10 9 9 10 9 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="1" fill="currentColor"/>
      <path d="M3 13L2 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
