# Markdown Editor

A feature-rich Markdown editor with real-time preview, built with React and Next.js.

## Features

- Real-time preview with split-screen and full-screen modes
- Support for GitHub Flavored Markdown
- Toolbar with common formatting options
- Emoji support using `:emoji_code:` syntax
- Grammar and spelling checking with LanguageTool API
- Executable JavaScript code blocks
- Mermaid diagram support
- File system operations (open, save, save as)
- Keyboard shortcuts for common actions
- Dark and light theme support
- Reading statistics (words, chars, reading time)
- Soft purple breathing glow effect on hover

## Usage

```jsx
import { MarkdownEditor } from "@/components/markdown-editor"

export default function MyEditor() {
  return (
    <MarkdownEditor
      initialValue="# Hello World"
      onChange={(value) => console.log(value)}
    />
  )
}
```

## Props

| Prop           | Type     | Default     | Description                              |
| -------------- | -------- | ----------- | ---------------------------------------- |
| `initialValue` | string   | `""`        | Initial markdown content                 |
| `onChange`     | function | `undefined` | Callback fired when content changes      |
| `className`    | string   | `undefined` | Additional class names for the container |

## Mermaid Diagram Support

The editor supports Mermaid.js diagrams for creating visualizations directly in your markdown. Use a code block with the "mermaid" language identifier:

````markdown
```mermaid
graph LR
A[Square Rect] -- Link text --> B((Circle))
A --> C(Round Rect)
B --> D{Rhombus}
C --> D
```
````

This will render as an interactive diagram in the preview mode.

### Supported Diagram Types

- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity Relationship diagrams
- User Journey diagrams
- Gantt charts
- Pie charts

### Example: Sequence Diagram

````markdown
```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
```
````

## Keyboard Shortcuts

See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for a full list of available keyboard shortcuts.

## Hover Glow Effect

The editor features a subtle breathing glow effect that activates when hovering over the gap/margin area around the editor container. This effect creates a soft purple pulsing border that enhances the user experience without interfering with editing functionality.

### HTML Structure

The editor requires a specific HTML structure to enable the hover effect:

```jsx
<div className="editor-wrapper">
  <div className="editor-container">
    {/* Editor content */}
  </div>
</div>
```

### Effect Details

- **Activation**: The effect only triggers when hovering over the gap/margin around the editor, not inside the editable text area
- **Animation**: Gentle breathing animation with a 2-second duration and ease-in-out timing
- **Color**: Soft purple glow (#8b5cf6) with varying opacity levels
- **Performance**: Uses `will-change: box-shadow` for optimized rendering
- **Theme Support**: Colors adapt based on light or dark theme
