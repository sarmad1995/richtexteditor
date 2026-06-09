import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

interface Props {
  onChange: (words: number, chars: number) => void
}

/**
 * Counts words and characters in the editor on every update.
 * Calls onChange with the latest counts so the parent can render them.
 *
 * Word rule:  split on whitespace, ignore empty tokens.
 * Char rule:  all non-whitespace characters (no spaces/newlines).
 */
export function WordCountPlugin({ onChange }: Props) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const count = (text: string) => {
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.replace(/\s/g, '').length
      onChange(words, chars)
    }

    // Initial count when the plugin mounts
    editor.read(() => count($getRoot().getTextContent()))

    // Recount after every content change
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => count($getRoot().getTextContent()))
    })
  }, [editor, onChange])

  return null
}
