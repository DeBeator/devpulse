import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github } from 'lucide-react'
import Link from 'next/link'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const error = params.error

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign in to DevPulse</CardTitle>
          <CardDescription>
            Connect your GitHub account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <p className="text-sm text-destructive text-center">
              Authentication failed. Please try again.
            </p>
          )}
          <Button asChild className="w-full" size="lg">
            <Link href="/auth/login">
              <Github className="mr-2 h-5 w-5" />
              Sign in with GitHub
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
