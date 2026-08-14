'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function CalculateHealthButton({
  repositoryId,
}: {
  repositoryId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function calculate() {
    try {
      setLoading(true)
      await fetch(`/api/repositories/${repositoryId}/health`, {
        method: 'POST',
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full"
      onClick={calculate}
      disabled={loading}
    >
      {loading ? 'Calculating...' : 'Calculate Health Score'}
    </Button>
  )
}
