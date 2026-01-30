import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center space-y-8 text-center">
        {/* 404 Image */}
        <div className="relative h-[400px] w-[400px] md:h-[500px] md:w-[500px]">
          <Image
            src="/404.png"
            alt="404 - Page Not Found"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            PAGE NOT FOUND
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Sorry, we couldn&apos;t find the page you were looking for.
          </p>
          <p className="text-sm text-muted-foreground md:text-base">
            Perhaps you mistyped the URL, or the page has been moved.
          </p>
        </div>

        {/* Home Button */}
        <Link href="/">
          <Button
            size="lg"
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
