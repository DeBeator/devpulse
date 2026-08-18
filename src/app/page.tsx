'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Github, BarChart2, Shield, Lightbulb, Activity, GitBranch, Bot } from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

const features = [
  {
    icon: Activity,
    title: 'Project Health Score',
    description: 'A single score that tells you how healthy your repository is — with full explanations of every factor.',
  },
  {
    icon: BarChart2,
    title: 'Repository Analytics',
    description: 'Commits, pull requests, issues, releases, and contributors — visualized over time.',
  },
  {
    icon: Lightbulb,
    title: 'Actionable Insights',
    description: 'Stale PRs, growing issue backlogs, declining activity — DevPulse tells you what needs attention.',
  },
  {
    icon: Shield,
    title: 'Security Scanning',
    description: 'Detect exposed secrets and credentials in your repository with Vaultless by FarukDev.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Ask questions about your repository health and get answers grounded in real data.',
  },
  {
    icon: GitBranch,
    title: 'GitHub Integration',
    description: 'Connect your repositories in seconds. DevPulse syncs automatically via GitHub webhooks.',
  },
]

const steps = [
  { step: '01', title: 'Connect GitHub', description: 'Sign in with GitHub and select the repositories you want to monitor.' },
  { step: '02', title: 'Analyze', description: 'DevPulse fetches your repository data and calculates a health score.' },
  { step: '03', title: 'Understand', description: 'See what\'s healthy, what needs attention, and why.' },
  { step: '04', title: 'Improve', description: 'Act on insights, track progress, and watch your score improve.' },
]

function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = canvas.offsetWidth
    let height = canvas.offsetHeight

    canvas.width = width
    canvas.height = height

    const nodes: Array<{
      x: number
      y: number
      vx: number
      vy: number
      pulse: number
      pulseSpeed: number
    }> = []

    const NODE_COUNT = 60

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      })
    }

    const MAX_DISTANCE = 150

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)

      // Update nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        node.pulse += node.pulseSpeed

        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < MAX_DISTANCE) {
            const opacity = (1 - dist / MAX_DISTANCE) * 0.15
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(node.pulse) * 0.5 + 0.5
        const radius = 2 + pulse * 1.5
        const opacity = 0.2 + pulse * 0.4

        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <span className="font-semibold text-base tracking-tight">DevPulse</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Sign in with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full py-28 overflow-hidden">
        <NetworkBackground />
        <div className="relative z-10 w-full px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Now in beta
          </div>
          <h1 className="text-6xl font-bold tracking-tight mb-6">
            Know the health of your codebase.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            DevPulse turns GitHub activity, project metrics, and security findings
            into actionable insights for developers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                <Github className="h-5 w-5 mr-2" />
                Connect GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20 w-full">
        <div className="w-full px-8 py-20">
          <h2 className="text-2xl font-semibold text-center mb-3">
            Everything you need to understand your repositories
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            From raw GitHub data to actionable intelligence.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-lg border p-6 space-y-3 hover:border-primary/50 transition-colors"
              >
                <feature.icon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full px-8 py-20">
        <h2 className="text-2xl font-semibold text-center mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.step} className="space-y-3 relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-4 left-full w-full h-px bg-border -translate-y-1/2 z-0" />
              )}
              <span className="text-3xl font-bold text-primary/20">
                {step.step}
              </span>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-b bg-muted/20 w-full">
        <div className="w-full px-8 py-16 text-center">
          <Shield className="h-8 w-8 mx-auto mb-4 text-primary" />
          <h2 className="text-lg font-semibold mb-2">Security you can trust</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Secret scanning powered by{' '}
            <a
              href="https://github.com/1FarukDev/Vaultless"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Vaultless
            </a>{' '}
            by FarukDev. Detected secrets are masked before storage — your
            credentials are never exposed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-8 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to understand your codebase?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Connect your GitHub repositories and get your first health score in minutes.
        </p>
        <Button asChild size="lg">
          <Link href="/login">
            <Github className="h-5 w-5 mr-2" />
            Get started free
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t w-full">
        <div className="w-full px-8 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>DevPulse — Developer Intelligence Platform</span>
          <span>
            Security scanning by{' '}
            <a
              href="https://github.com/1FarukDev/Vaultless"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Vaultless
            </a>{' '}
            · FarukDev
          </span>
        </div>
      </footer>
    </div>
  )
}
