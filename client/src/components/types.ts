export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number'

export interface ToolbarState {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  blockType: BlockType
}
