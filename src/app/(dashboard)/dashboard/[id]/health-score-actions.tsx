'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function HealthScoreActions({ repositoryId }: { repositoryId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function calculateScore() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/repositories/${repositoryId}/health`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to calculate health score')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate health score')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={calculateScore}
        disabled={loading}
        size="sm"
        className="w-full"
      >
        {loading ? 'Calculating...' : 'Recalculate Score'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
