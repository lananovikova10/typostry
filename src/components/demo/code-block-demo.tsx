"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "@/components/ui/code-block"

export function CodeBlockThemed() {
  const [copied, setCopied] = useState(false)

  const code = `function calculateTotal(items) {
  return items
    .filter(item => item.price > 0)
    .reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
}`

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-[450px]">
      <CodeBlock>
        <CodeBlockGroup className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              JavaScript
            </div>
            <span className="text-sm text-muted-foreground">
              GitHub Dark Theme
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </CodeBlockGroup>
        <CodeBlockCode code={code} language="javascript" theme="github-dark" />
      </CodeBlock>
    </div>
  )
}
