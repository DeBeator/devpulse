'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock, Globe, Star, GitFork, Plus, Check } from 'lucide-react'
import type { GitHubRepository, ConnectedRepository } from '@/types'

export default function RepositoriesPage() {
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([])
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const [githubRes, connectedRes] = await Promise.all([
        fetch('/api/github/repositories'),
        fetch('/api/repositories'),
      ])

      if (!githubRes.ok) {
        const data = await githubRes.json()
        throw new Error(data.error ?? 'Failed to fetch repositories')
      }

      const githubData = await githubRes.json()
      setGithubRepos(githubData.repositories)

      if (connectedRes.ok) {
        const connectedData = await connectedRes.json()
        setConnectedRepos(connectedData.repositories)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function connectRepository(repo: GitHubRepository) {
    try {
      setConnecting(repo.id)

      const res = await fetch('/api/repositories/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          html_url: repo.html_url,
          default_branch: repo.default_branch,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to connect repository')
      }

      setConnectedRepos((prev) => [...prev, data.repository])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect repository')
    } finally {
      setConnecting(null)
    }
  }

  const isConnected = (githubId: number) =>
    connectedRepos.some((r) => r.github_id === githubId)

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Connect a Repository</h1>
          <p className="text-muted-foreground mt-1">
            Select a GitHub repository to analyze with DevPulse.
          </p>
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Connect a Repository</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connect a Repository</h1>
        <p className="text-muted-foreground mt-1">
          Select a GitHub repository to analyze with DevPulse.
        </p>
      </div>

      {connectedRepos.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Connected ({connectedRepos.length})
          </h2>
          <div className="grid gap-3">
            {connectedRepos.map((repo) => (
              <Card key={repo.id} className="border-primary/20 bg-primary/5">
                <CardContent className="py-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{repo.full_name}</p>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground">{repo.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{repo.sync_status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Your repositories ({githubRepos.length})
        </h2>
        <div className="grid gap-3">
          {githubRepos.map((repo) => {
            const connected = isConnected(repo.id)
            return (
              <Card
                key={repo.id}
                className={connected ? 'opacity-50' : ''}
              >
                <CardContent className="py-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {repo.private ? (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{repo.full_name}</p>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {repo.language && (
                          <span className="text-xs text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitFork className="h-3 w-3" />
                          {repo.forks_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={connected ? 'secondary' : 'default'}
                    disabled={connected || connecting === repo.id}
                    onClick={() => !connected && connectRepository(repo)}
                  >
                    {connected ? (
                      <><Check className="h-3 w-3 mr-1" /> Connected</>
                    ) : connecting === repo.id ? (
                      'Connecting...'
                    ) : (
                      <><Plus className="h-3 w-3 mr-1" /> Connect</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
