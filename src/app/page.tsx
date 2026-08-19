'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Fixed video background — stays behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay so text is always readable */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/70 backdrop-blur-md border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight text-white">
            DevPulse
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="bg-white text-black hover:bg-white/90 border-0"
            >
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Sign in with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — full viewport, sits above fixed video */}
      <section className="relative z-10 w-full h-screen flex flex-col items-center justify-center">
        <div className="text-center px-8 max-w-4xl mx-auto pt-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 text-xs text-white/60 mb-8 bg-white/5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Now in beta
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.08] text-white">
            Know the health
            <br />
            <span className="text-indigo-400">of your codebase.</span>
          </h1>

          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-8 leading-relaxed">
            DevPulse turns GitHub activity, project metrics, and security
            findings into actionable insights for developers.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
            >
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <Link href="/login">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-white/30" />
        </div>
      </section>

      {/* Integration strip */}
      <section className="relative z-10 w-full bg-background/95 border-t border-border/50">
        <div className="w-full px-8 py-6">
          <p className="text-center text-xs text-muted-foreground mb-4 tracking-wide uppercase">
            Works with the tools you already use
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {['GitHub', 'Git', 'Next.js', 'TypeScript', 'React', 'Node.js'].map((tool) => (
              <span key={tool} className="text-sm text-muted-foreground/60 font-medium">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* All content below hero has solid background — covers the video */}
      <div className="relative z-10">

        {/* Features */}
        <section className="w-full bg-background border-t border-border">
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
                  className="rounded-lg border border-border/50 p-5 space-y-2.5 bg-card hover:border-primary/30 transition-colors"
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
        <section className="w-full bg-muted/30 border-t border-border">
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

        {/* Who it's for */}
        <section className="w-full bg-background border-t border-border">
          <div className="w-full px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold mb-2">
                Built for developers who care about their projects
              </h2>
              <p className="text-muted-foreground text-sm">
                Whether you work alone or with a team.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                {
                  title: 'Solo Developers',
                  description:
                    'Keep your side projects healthy and know which ones need attention — without manually checking each repository.',
                },
                {
                  title: 'Open Source Maintainers',
                  description:
                    'Track project activity, contributor trends, releases, issues, and security findings across your open source work.',
                },
                {
                  title: 'Small Teams',
                  description:
                    'Get a quick view of repository health without digging through GitHub. Know what needs attention before it becomes a problem.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/50 p-6 space-y-3 bg-card"
                >
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="w-full bg-background border-t border-border">
          <div className="w-full px-8 py-12 text-center">
            <Shield className="h-6 w-6 mx-auto mb-3 text-primary" />
            <h2 className="text-base font-semibold mb-2">
              Security you can trust
            </h2>
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

        {/* FAQ */}
        <section className="w-full bg-muted/20 border-t border-border">
          <div className="w-full px-8 py-16">
            <h2 className="text-2xl font-semibold text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="max-w-2xl mx-auto space-y-6">
              {[
                {
                  q: 'What is DevPulse?',
                  a: 'DevPulse is a developer intelligence platform that connects to your GitHub repositories and turns raw data into actionable insights — health scores, analytics, security findings, and AI-powered explanations.',
                },
                {
                  q: 'How does the health score work?',
                  a: 'The health score is calculated deterministically across 7 categories: Activity, Pull Requests, Issues, Security, Releases, Contributors, and Documentation. Every score comes with a full explanation of the contributing factors.',
                },
                {
                  q: 'What happens when I connect GitHub?',
                  a: 'DevPulse uses GitHub OAuth to authenticate you. We request read access to your repositories to fetch commits, pull requests, issues, releases, and contributors. We never modify your code or repository settings.',
                },
                {
                  q: 'Does DevPulse access my private repositories?',
                  a: 'Yes, if you grant access. DevPulse uses the repo scope to access private repositories. Your data is stored securely and is only accessible to you.',
                },
                {
                  q: 'Does DevPulse store my source code?',
                  a: 'No. DevPulse only stores metadata — commit messages, PR titles, issue titles, contributor names, and release tags. We never store your actual source code.',
                },
                {
                  q: 'How does the security scan work?',
                  a: 'Security scanning is powered by Vaultless by FarukDev. It scans your repository files for exposed secrets, API keys, and credentials. Detected values are masked before storage — we never store complete secret values.',
                },
                {
                  q: 'What is Vaultless?',
                  a: 'Vaultless is an open-source secret scanner built by FarukDev. DevPulse uses it for repository security scanning with explicit permission from its creator.',
                },
                {
                  q: 'Can I disconnect a repository?',
                  a: 'Yes. You can disconnect any repository from the Repositories page at any time. This removes all associated data from DevPulse.',
                },
              ].map((item) => (
                <div key={item.q} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-sm font-medium mb-2">{item.q}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full bg-muted/30 border-t border-border">
          <div className="w-full px-8 py-20 text-center">
            <h2 className="text-4xl font-bold mb-3">
              Your repository already has the answers.
            </h2>
            <p className="text-muted-foreground text-sm mb-2 max-w-sm mx-auto">
              DevPulse helps you find them.
            </p>
            <p className="text-muted-foreground text-xs mb-8 max-w-sm mx-auto">
              Get your first repository health score in minutes.
            </p>
            <Button asChild size="lg">
              <Link href="/login">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub →
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-background">
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
    </div>
  )
}
