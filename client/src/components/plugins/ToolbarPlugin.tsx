import { useCallback, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode, ListNode } from '@lexical/list'
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import type { ToolbarState } from '../types'

interface ToolbarPluginProps {
  onStateChange: (state: ToolbarState) => void
}

export function ToolbarPlugin({ onStateChange }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext()

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow()

    let blockType: ToolbarState['blockType'] = 'paragraph'
    if ($isHeadingNode(element)) {
      blockType = element.getTag() as ToolbarState['blockType']
    } else if ($isListNode(element)) {
      const listNode = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
      blockType = listNode?.getListType() === 'number' ? 'number' : 'bullet'
    }

    onStateChange({
      isBold: selection.hasFormat('bold'),
      isItalic: selection.hasFormat('italic'),
      isUnderline: selection.hasFormat('underline'),
      isStrikethrough: selection.hasFormat('strikethrough'),
      blockType,
    })
  }, [onStateChange])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar())
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor, updateToolbar])

  return null
}
