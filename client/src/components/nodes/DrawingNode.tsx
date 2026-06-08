/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  DecoratorNode,
  $getNodeByKey,
  type NodeKey,
  type SerializedLexicalNode,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import '@excalidraw/excalidraw/index.css'

// Lazy-load Excalidraw — it's ~5MB, no reason to block initial paint
const ExcalidrawLazy = React.lazy(async () => {
  const { Excalidraw } = await import('@excalidraw/excalidraw')
  return { default: Excalidraw }
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface SerializedDrawingNode extends SerializedLexicalNode {
  type: 'drawing'
  data: string
  version: 1
}

// ─── React component that renders inside the editor ───────────────────────────

function DrawingComponent({ data, nodeKey }: { data: string; nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Parse once on mount — component is source of truth for canvas state
  const [initialElements] = useState(() => {
    try { return JSON.parse(data) || [] } catch { return [] }
  })

  // Clean up pending save on unmount
  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  // Debounced write-back to Lexical node (and therefore localStorage)
  const handleChange = useCallback((elements: readonly unknown[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isDrawingNode(node)) node.setData(JSON.stringify(elements))
      })
    }, 300)
  }, [editor, nodeKey])

  return (
    <div
      className="my-4 rounded-xl border border-gray-200 overflow-hidden"
      style={{ height: 420 }}
      // Stop Lexical from processing mouse/keyboard events inside the canvas
      onMouseDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      // Prevent Lexical from collapsing selection when clicking into canvas
      onPointerDown={e => e.stopPropagation()}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-sm text-gray-400 bg-gray-50">
            Loading canvas…
          </div>
        }
      >
        <ExcalidrawLazy
          initialData={{ elements: initialElements }}
          onChange={handleChange}
        />
      </Suspense>
    </div>
  )
}

// ─── Lexical node ─────────────────────────────────────────────────────────────

export class DrawingNode extends DecoratorNode<JSX.Element> {
  __data: string

  static getType(): string { return 'drawing' }

  static clone(node: DrawingNode): DrawingNode {
    return new DrawingNode(node.__data, node.__key)
  }

  static importJSON(serialized: SerializedDrawingNode): DrawingNode {
    return new DrawingNode(serialized.data)
  }

  constructor(data = '[]', key?: NodeKey) {
    super(key)
    this.__data = data
  }

  exportJSON(): SerializedDrawingNode {
    return { type: 'drawing', data: this.__data, version: 1 }
  }

  // Block-level (not inline)
  isInline(): false { return false }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  // React reconciles the component — Lexical doesn't need to touch the DOM
  updateDOM(): boolean { return false }

  setData(data: string): void {
    this.getWritable().__data = data
  }

  decorate(): JSX.Element {
    return <DrawingComponent data={this.__data} nodeKey={this.__key} />
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function $createDrawingNode(): DrawingNode {
  return new DrawingNode()
}

export function $isDrawingNode(node: unknown): node is DrawingNode {
  return node instanceof DrawingNode
}
