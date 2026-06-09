import { useState, useCallback, useMemo } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin'
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext'
import type { EditorState } from 'lexical'
import {
  HEADING, QUOTE, CODE,
  UNORDERED_LIST, ORDERED_LIST,
  BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR, BOLD_UNDERSCORE,
  ITALIC_STAR, ITALIC_UNDERSCORE,
  INLINE_CODE, STRIKETHROUGH,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { DrawingNode } from './nodes/DrawingNode'
import { Toolbar } from './Toolbar'
import { ToolbarPlugin } from './plugins/ToolbarPlugin'
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin'
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin'
import type { ToolbarState } from './types'

// ─── Config ───────────────────────────────────────────────────────────────────

// Point to local server during development; swap this for the Railway URL before deploy
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:1234'

// All editors sharing the same ROOM_ID see the same document
const ROOM_ID = 'main-doc'

const MD_TRANSFORMERS = [
  HEADING, QUOTE, CODE,
  UNORDERED_LIST, ORDERED_LIST,
  BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR, BOLD_UNDERSCORE,
  ITALIC_STAR, ITALIC_UNDERSCORE,
  INLINE_CODE, STRIKETHROUGH,
]

// editorState MUST be null when using CollaborationPlugin —
// Yjs owns the document state, not the LexicalComposer initializer.
const initialConfig = {
  namespace: 'RichTextEditor',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, DrawingNode],
  editorState: null,
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

// ─── Provider factory (called once by CollaborationPlugin) ─────────────────────
// Must return a Yjs provider. We keep this outside the component so it isn't
// recreated on every render.
function providerFactory(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
): WebsocketProvider {
  const doc = new Y.Doc()
  yjsDocMap.set(id, doc)
  return new WebsocketProvider(WS_URL, id, doc)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  username: string
  userColor: string
}

export function Editor({ username, userColor }: Props) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(defaultToolbarState)

  const handleStateChange = useCallback((state: ToolbarState) => {
    setToolbarState(state)
  }, [])

  // useMemo so the config object is stable across renders
  const config = useMemo(() => ({ ...initialConfig }), [])

  return (
    <LexicalCollaboration>
    <LexicalComposer initialConfig={config}>
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
                Start writing…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
          <ToolbarPlugin onStateChange={handleStateChange} />
          <FloatingToolbarPlugin />
          <SlashCommandPlugin />

          {/*
           * CollaborationPlugin wires Lexical ↔ Yjs.
           * - id: room name — all clients with the same id share a document
           * - providerFactory: creates the WebsocketProvider (called once)
           * - shouldBootstrap: true = start with an empty doc if the room is new
           * - username/cursorColor: sent via Yjs awareness to other clients
           *   so they can render this user's cursor label
           */}
          <CollaborationPlugin
            id={ROOM_ID}
            providerFactory={providerFactory}
            shouldBootstrap={true}
            username={username}
            cursorColor={userColor}
          />
        </div>
      </div>
    </LexicalComposer>
    </LexicalCollaboration>
  )
}
