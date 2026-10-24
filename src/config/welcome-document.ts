export const WELCOME_MARKDOWN = `# Hello World

This is a markdown editor. Try editing this text or use the toolbar to add markdown elements.

## Features

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Images
- Code blocks
- Executable JavaScript code blocks (click the run button in preview mode)

\`\`\`js
// Click the play button in preview mode to run this code
console.log('Hello, world!');
alert('JavaScript execution works!');
\`\`\`

\`\`\`js
// Try another example with DOM manipulation
const div = document.createElement('div');
div.textContent = 'This element was created dynamically!';
div.style.padding = '10px';
div.style.backgroundColor = '#f0f0f0';
div.style.border = '1px solid #ddd';
div.style.borderRadius = '4px';
div.style.marginTop = '10px';

// Append to the preview container
document.querySelector('[data-testid="markdown-preview"]').appendChild(div);
\`\`\`

> Blockquotes are also supported

Enjoy writing markdown!`
