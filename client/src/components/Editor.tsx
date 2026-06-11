import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LexicalCollaboration } from "@lexical/react/LexicalCollaborationContext";
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
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { DrawingNode } from "./nodes/DrawingNode";
import { Toolbar } from "./Toolbar";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { SlashCommandPlugin } from "./plugins/SlashCommandPlugin";
import { WordCountPlugin } from "./plugins/WordCountPlugin";
import type { ToolbarState, ConnStatus, Collaborator } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:1234";
const ROOM_ID = "main-doc";

const MD_TRANSFORMERS = [
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
];

// editorState must be null — Yjs owns document state when CollaborationPlugin is used
const EDITOR_CONFIG = {
  namespace: "RichTextEditor",
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    DrawingNode,
  ],
  editorState: null,
  onError(error: Error) {
    console.error(error);
  },
  theme: {
    text: {
      bold: "font-bold",
      italic: "italic",
      underline: "underline",
      strikethrough: "line-through",
      code: "editor-inline-code",
    },
    heading: { h1: "editor-h1", h2: "editor-h2", h3: "editor-h3" },
    list: {
      ul: "list-disc pl-6",
      ol: "list-decimal pl-6",
      listitem: "my-0.5",
    },
    quote: "editor-quote",
    code: "editor-code-block",
  },
};

const DEFAULT_TOOLBAR_STATE: ToolbarState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  blockType: "paragraph",
};

function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  username: string;
  userColor: string;
  onStatusChange: (status: ConnStatus) => void;
  onCollaboratorsChange: (peers: Collaborator[]) => void;
}

export function Editor({
  username,
  userColor,
  onStatusChange,
  onCollaboratorsChange,
}: Props) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(
    DEFAULT_TOOLBAR_STATE,
  );
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  // Ref trick: keeps callbacks stable so providerFactory (empty deps) never
  // needs to be recreated, yet always calls the latest version.
  const onStatusChangeRef = useRef(onStatusChange);
  const onCollaboratorsChangeRef = useRef(onCollaboratorsChange);

  // Update refs after each render (useLayoutEffect so they're current before
  // any effects or event handlers fire — avoids the "stale closure" problem).
  useLayoutEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onCollaboratorsChangeRef.current = onCollaboratorsChange;
  });

  const handleToolbarState = useCallback(
    (state: ToolbarState) => setToolbarState(state),
    [],
  );
  const handleWordCount = useCallback(
    (words: number, chars: number) => setWordCount({ words, chars }),
    [],
  );

  // Called exactly once by CollaborationPlugin on mount — must be stable.
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);
      const provider = new WebsocketProvider(WS_URL, id, doc);

      // WebSocket status → App
      provider.on("status", ({ status }: { status: string }) => {
        const s: ConnStatus =
          status === "connected"
            ? "connected"
            : status === "connecting"
              ? "connecting"
              : "disconnected";
        onStatusChangeRef.current(s);
      });

      // Yjs awareness (presence) → App
      const broadcastPeers = () => {
        const states = provider.awareness.getStates() as Map<
          number,
          { name?: string; color?: string }
        >;
        const myId = provider.awareness.clientID;
        const peers: Collaborator[] = [];
        states.forEach((state, clientId) => {
          if (clientId !== myId && state.name) {
            peers.push({
              clientId,
              name: state.name,
              color: state.color ?? "#6366f1",
            });
          }
        });
        onCollaboratorsChangeRef.current(peers);
      };
      provider.awareness.on("change", broadcastPeers);

      return provider;
    },
    [],
  ); // intentionally empty — stable reference

  return (
    <LexicalCollaboration>
      <LexicalComposer initialConfig={EDITOR_CONFIG}>
        <div className="flex flex-col h-full">
          <Toolbar state={toolbarState} />

          {/* Scrollable content area */}
          <div className="flex-1 relative overflow-y-auto">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="editor-content px-16 py-12 min-h-full focus:outline-none"
                  aria-label="Rich text editor"
                />
              }
              placeholder={
                <div className="editor-placeholder px-16 py-12 pointer-events-none select-none">
                  Start writing…
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
            <ToolbarPlugin onStateChange={handleToolbarState} />
            <FloatingToolbarPlugin />
            <SlashCommandPlugin />
            <WordCountPlugin onChange={handleWordCount} />
            <CollaborationPlugin
              id={ROOM_ID}
              // @ts-expect-error providerFactory types don't match CollaborationPlugin props
              providerFactory={providerFactory}
              shouldBootstrap={true}
              username={username}
              cursorColor={userColor}
            />
          </div>

          {/* Word count footer */}
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-16 py-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 select-none transition-colors duration-200">
            <span>{plural(wordCount.words, "word")}</span>
            <span>{wordCount.chars.toLocaleString()} characters</span>
          </div>
        </div>
      </LexicalComposer>
    </LexicalCollaboration>
  );
}
