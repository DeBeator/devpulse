'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Github,
  BarChart2,
  Shield,
  Lightbulb,
  Activity,
  GitBranch,
  Bot,
  ChevronDown,
} from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

const features = [
  {
    icon: Activity,
    title: 'Project Health Score',
    description:
      'A single score that tells you how healthy your repository is — with full explanations of every factor.',
  },
  {
    icon: BarChart2,
    title: 'Repository Analytics',
    description:
      'Commits, pull requests, issues, releases, and contributors — visualized over time.',
  },
  {
    icon: Lightbulb,
    title: 'Actionable Insights',
    description:
      'Stale PRs, growing issue backlogs, declining activity — DevPulse tells you what needs attention.',
  },
  {
    icon: Shield,
    title: 'Security Scanning',
    description:
      'Detect exposed secrets and credentials in your repository with Vaultless by FarukDev.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description:
      'Ask questions about your repository health and get answers grounded in real data.',
  },
  {
    icon: GitBranch,
    title: 'GitHub Integration',
    description:
      'Connect your repositories in seconds. DevPulse syncs automatically via GitHub webhooks.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Connect GitHub',
    description: 'Sign in with GitHub and select the repositories you want to monitor.',
  },
  {
    step: '02',
    title: 'Analyze',
    description: 'DevPulse fetches your repository data and calculates a health score.',
  },
  {
    step: '03',
    title: 'Understand',
    description: "See what's healthy, what needs attention, and why.",
  },
  {
    step: '04',
    title: 'Improve',
    description: 'Act on insights, track progress, and watch your score improve.',
  },
]

function HeroCanvas() {
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

    // Check dark mode
    const isDark = document.documentElement.classList.contains('dark')
    const nodeColor = isDark ? '99, 102, 241' : '79, 70, 229'
    const lineOpacityMultiplier = isDark ? 1 : 0.6

    interface Node {
      x: number
      y: number
      vx: number
      vy: number
      pulse: number
      pulseSpeed: number
    }

    const NODE_COUNT = 50
    const MAX_DISTANCE = 140

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.015,
    }))

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)

      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        node.pulse += node.pulseSpeed
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DISTANCE) {
            const opacity = (1 - dist / MAX_DISTANCE) * 0.12 * lineOpacityMultiplier
            ctx.strokeStyle = `rgba(${nodeColor}, ${opacity})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Nodes — small and subtle
      for (const node of nodes) {
        const pulse = Math.sin(node.pulse) * 0.5 + 0.5
        const opacity = (0.2 + pulse * 0.25) * lineOpacityMultiplier
        const radius = 1.5 + pulse * 0.8

        ctx.fillStyle = `rgba(${nodeColor}, ${opacity})`
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
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
    />
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight">DevPulse</span>
          <div className="flex items-center gap-2">
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
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <HeroCanvas />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, var(--background) 100%)',
          }}
        />

        <div className="relative z-10 text-center px-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Now in beta
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.08]">
            Know the health
            <br />
            <span className="text-primary">of your codebase.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            DevPulse turns GitHub activity, project metrics, and security
            findings into actionable insights for developers.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
          <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </section>

      {/* Features */}
      <section className="w-full border-t bg-muted/20">
        <div className="w-full px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold mb-2">
              Everything you need to understand your repositories
            </h2>
            <p className="text-muted-foreground text-sm">
              From raw GitHub data to actionable intelligence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border/50 p-5 space-y-2.5 bg-background hover:border-primary/30 transition-colors"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full">
        <div className="w-full px-8 py-16">
          <h2 className="text-2xl font-semibold text-center mb-10">
            How it works
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.step} className="space-y-2.5 relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-3.5 left-full w-full h-px bg-border z-0" />
                )}
                <span className="text-2xl font-bold text-primary/20">
                  {step.step}
                </span>
                <h3 className="font-medium text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="w-full border-t border-b bg-muted/20">
        <div className="w-full px-8 py-12 text-center">
          <Shield className="h-6 w-6 mx-auto mb-3 text-primary" />
          <h2 className="text-base font-semibold mb-2">Security you can trust</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
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
      <section className="w-full">
        <div className="w-full px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-3">
            Ready to understand your codebase?
          </h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
            Connect your GitHub repositories and get your first health score
            in minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              <Github className="h-4 w-4 mr-2" />
              Get started free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="w-full px-8 py-5 flex items-center justify-between text-xs text-muted-foreground">
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
