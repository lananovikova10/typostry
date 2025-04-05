import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"
import { MarkdownEditor } from "@/components/markdown-editor"

export default function Home() {
  return (
    <main className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col items-start gap-4 text-left">
          <div className="flex items-center gap-3">
            <Icons.logo className="h-10 w-10" />
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
              {siteConfig.name}
            </h1>
          </div>
          <p className="leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            A fully-featured markdown editor with preview functionality
          </p>

        </div>

        <MarkdownEditor
          initialValue={`# Hello World

This is a markdown editor. Try editing this text or use the toolbar to add markdown elements.

## Features

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Images
- Code blocks
- **NEW**: Executable JavaScript code blocks (click the run button in preview mode)

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

Enjoy writing markdown!`}
          className="min-h-[500px]"
        />
      </div>
    </main>
  )
}
