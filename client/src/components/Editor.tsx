import { useState, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import {
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  INLINE_CODE,
  STRIKETHROUGH,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { Toolbar } from './Toolbar'
import { ToolbarPlugin } from './plugins/ToolbarPlugin'
import type { ToolbarState } from './types'

const MD_TRANSFORMERS = [
  HEADING, QUOTE, CODE,
  UNORDERED_LIST, ORDERED_LIST,
  BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR, BOLD_UNDERSCORE,
  ITALIC_STAR, ITALIC_UNDERSCORE,
  INLINE_CODE, STRIKETHROUGH,
]

const initialConfig = {
  namespace: 'RichTextEditor',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode],
  onError(error: Error) {
    console.error(error)
  },
  theme: {
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'editor-inline-code',
    },
    heading: {
      h1: 'editor-h1',
      h2: 'editor-h2',
      h3: 'editor-h3',
    },
    list: {
      ul: 'list-disc pl-6',
      ol: 'list-decimal pl-6',
      listitem: 'my-0.5',
    },
    quote: 'editor-quote',
    code: 'editor-code-block',
  },
}

const defaultToolbarState: ToolbarState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  blockType: 'paragraph',
}

export function Editor() {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(defaultToolbarState)

  const handleStateChange = useCallback((state: ToolbarState) => {
    setToolbarState(state)
  }, [])

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col h-full">
        <Toolbar state={toolbarState} />
        <div className="flex-1 relative overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-content px-16 py-12 min-h-full focus:outline-none"
                aria-label="Rich text editor"
              />
            }
            placeholder={
              <div className="editor-placeholder px-16 py-12 pointer-events-none select-none text-gray-400">
                Start writing...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
          <ToolbarPlugin onStateChange={handleStateChange} />
        </div>
      </div>
    </LexicalComposer>
  )
}
