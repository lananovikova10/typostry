import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function DocumentNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-dashed px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">Document not found</h1>
      <p className="text-sm text-muted-foreground">
        It may have been deleted, or it belongs to another account.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to my documents</Link>
      </Button>
    </div>
  )
}
