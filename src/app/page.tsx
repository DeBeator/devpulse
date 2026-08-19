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
    description:
      'Sign in with GitHub and select the repositories you want to monitor.',
  },
  {
    step: '02',
    title: 'Analyze',
    description:
      'DevPulse fetches your repository data and calculates a health score.',
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
    let width = window.innerWidth
    let height = window.innerHeight

    canvas.width = width
    canvas.height = height

    const NODE_COUNT = 80
    const MAX_DISTANCE = 180
    const PULSE_INTERVAL = 3000

    interface Node {
      x: number
      y: number
      vx: number
      vy: number
      pulse: number
      pulseSpeed: number
      size: number
    }

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2,
    }))

    // Pulse wave state
    let pulseWave: { x: number; y: number; radius: number; maxRadius: number } | null = null
    let lastPulseTime = 0

    function triggerPulse() {
      const node = nodes[Math.floor(Math.random() * nodes.length)]
      pulseWave = {
        x: node.x,
        y: node.y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.8,
      }
    }

    function draw(timestamp: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)

      // Trigger pulse wave periodically
      if (timestamp - lastPulseTime > PULSE_INTERVAL) {
        triggerPulse()
        lastPulseTime = timestamp
      }

      // Draw pulse wave
      if (pulseWave) {
        pulseWave.radius += 3
        const opacity = Math.max(0, 0.15 * (1 - pulseWave.radius / pulseWave.maxRadius))
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(pulseWave.x, pulseWave.y, pulseWave.radius, 0, Math.PI * 2)
        ctx.stroke()
        if (pulseWave.radius >= pulseWave.maxRadius) {
          pulseWave = null
        }
      }

      // Update and draw nodes
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
            const opacity = (1 - dist / MAX_DISTANCE) * 0.2
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
            ctx.lineWidth = 0.8
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
        const opacity = 0.3 + pulse * 0.5
        const radius = node.size + pulse * 1.2

        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 3
        )
        gradient.addColorStop(0, `rgba(99, 102, 241, ${opacity})`)
        gradient.addColorStop(1, `rgba(99, 102, 241, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = `rgba(129, 140, 248, ${opacity})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
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
      className="absolute inset-0 w-full h-full"
    />
  )
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
      <span className="text-xs text-white/40 tracking-widest uppercase">
        Scroll
      </span>
      <ChevronDown className="h-4 w-4 text-white/40" />
    </div>
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
    <div className="min-h-screen bg-[#050508]">
      {/* Sticky nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050508]/90 backdrop-blur-md border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <span className="font-semibold text-base text-white tracking-tight">
            DevPulse
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="bg-white text-black hover:bg-white/90"
            >
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Sign in with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — full viewport */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Dark background */}
        <div className="absolute inset-0 bg-[#050508]" />

        {/* Canvas */}
        <HeroCanvas />

        {/* Radial gradient overlay — darkens edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, #050508 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center px-8 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/50 mb-8 bg-white/5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Now in beta
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.05]">
            Know the health
            <br />
            <span className="text-indigo-400">of your codebase.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            DevPulse turns GitHub activity, project metrics, and security
            findings into actionable insights for developers.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 h-12 px-8 text-base"
            >
              <Link href="/login">
                <Github className="h-5 w-5 mr-2" />
                Connect GitHub
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/10 text-white hover:bg-white/5 h-12 px-8 text-base bg-transparent"
            >
              <Link href="/login">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <ScrollIndicator />
      </section>

      {/* Features */}
      <section className="w-full bg-[#080810] border-t border-white/5">
        <div className="w-full px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything you need to understand your repositories
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              From raw GitHub data to actionable intelligence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/5 p-6 space-y-3 bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-200"
              >
                <feature.icon className="h-5 w-5 text-indigo-400" />
                <h3 className="font-medium text-white">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-[#050508]">
        <div className="w-full px-8 py-24">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.step} className="space-y-3 relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-4 left-full w-full h-px bg-white/5 z-0" />
                )}
                <span className="text-4xl font-bold text-indigo-500/20">
                  {step.step}
                </span>
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="w-full bg-[#080810] border-t border-b border-white/5">
        <div className="w-full px-8 py-16 text-center">
          <Shield className="h-8 w-8 mx-auto mb-4 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Security you can trust
          </h2>
          <p className="text-sm text-white/40 max-w-lg mx-auto">
            Secret scanning powered by{' '}
            <a
              href="https://github.com/1FarukDev/Vaultless"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Vaultless
            </a>{' '}
            by FarukDev. Detected secrets are masked before storage — your
            credentials are never exposed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-[#050508]">
        <div className="w-full px-8 py-24 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to understand your codebase?
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto">
            Connect your GitHub repositories and get your first health score
            in minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 h-12 px-8 text-base"
          >
            <Link href="/login">
              <Github className="h-5 w-5 mr-2" />
              Get started free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050508]">
        <div className="w-full px-8 py-6 flex items-center justify-between text-sm text-white/30">
          <span>DevPulse — Developer Intelligence Platform</span>
          <span>
            Security scanning by{' '}
            <a
              href="https://github.com/1FarukDev/Vaultless"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/60 hover:text-indigo-400 underline"
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
