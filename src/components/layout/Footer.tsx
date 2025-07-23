/**
 * Footer - Basic footer component with copyright information
 * Displays year and author with responsive styling
 */

interface FooterProps {
  year?: number
  author: string
}

export function Footer({
  year = new Date().getFullYear(),
  author,
}: FooterProps) {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          <p className="text-base text-muted-foreground">
            © {year} {author}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
