import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">DevPulse</h1>
        <p className="text-xl text-muted-foreground">
          Developer intelligence for your GitHub repositories.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </main>
  )
}
