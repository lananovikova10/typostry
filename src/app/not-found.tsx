import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col items-center space-y-6 text-center">
        <div className="relative h-[240px] w-[240px] md:h-[320px] md:w-[320px]">
          <Image
            src="/404.png"
            alt="404 - Page Not Found"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Page not found
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            We couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        <Link href="/">
          <Button size="lg" className="mt-2">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
