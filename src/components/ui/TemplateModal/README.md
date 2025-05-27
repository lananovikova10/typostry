# TemplateModal Component

The TemplateModal component provides a dialog interface for browsing, searching, and inserting templates from GitLab into the editor.

## Features

- Fetches templates from GitLab API
- Displays loading, empty, and error states
- Supports template search/filtering
- Shows template previews
- Handles error recovery with retry functionality
- Responsive design for different screen sizes

## Usage

```tsx
import { TemplateModal } from "@/components/ui/TemplateModal"
import { useState } from "react"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSelectTemplate = (content: string) => {
    // Insert template content into your editor
    console.log("Selected template content:", content)
  }
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Templates
      </button>
      
      <TemplateModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  )
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls the visibility of the modal |
| `onClose` | `() => void` | Function called when the modal is closed |
| `onSelectTemplate` | `(content: string) => void` | Function called with the selected template content |

## States

The component handles several states:

1. **Loading State**: Displays a spinner while templates are being fetched
2. **Empty State**: Shows a message when no templates are available
3. **Error State**: Displays an error message with a retry button
4. **Content Loading State**: Shows a spinner while template content is being loaded
5. **Template Preview**: Displays a preview of the selected template

## API Integration

The component uses the GitLab API to fetch templates. The following functions from the GitLab API service are used:

- `fetchTemplateFiles()`: Fetches the list of templates
- `fetchTemplateContent(path)`: Fetches the content of a specific template
- `formatTemplateName(name)`: Formats the template filename for display
- `getTemplatePreview(content)`: Gets a preview of template content

## Configuration

GitLab API configuration is handled via environment variables as described in `/docs/GITLAB_TEMPLATES.md`.

## Error Handling

The component handles various error scenarios:

1. Failed to fetch template list
2. Failed to fetch template content
3. Empty template list
4. Network errors

When an error occurs, the component shows an error message with a "Try again" button that retries the failed operation.

## Accessibility

The component implements accessibility features:

- Proper ARIA roles and attributes
- Keyboard navigation
- Focus management
- Descriptive labels and instructions

## Testing

Tests for the component can be found in:
- Unit tests: `/src/components/ui/TemplateModal/__tests__/index.test.tsx`
- E2E tests: `/cypress/e2e/template-modal.cy.ts`