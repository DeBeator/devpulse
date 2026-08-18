import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Github,
  BarChart2,
  Shield,
  Lightbulb,
  Activity,
  GitBranch,
  Bot,
} from 'lucide-react'

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
  { step: '01', title: 'Connect GitHub', description: 'Sign in with GitHub and select the repositories you want to monitor.' },
  { step: '02', title: 'Analyze', description: 'DevPulse fetches your repository data and calculates a health score.' },
  { step: '03', title: 'Understand', description: 'See what\'s healthy, what needs attention, and why.' },
  { step: '04', title: 'Improve', description: 'Act on insights, track progress, and watch your score improve.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg">DevPulse</span>
          <Button asChild size="sm">
            <Link href="/login">
              <Github className="h-4 w-4 mr-2" />
              Sign in with GitHub
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Now in beta
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
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
            <Link href="/login">View Demo</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Everything you need to understand your repositories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-lg border p-6 space-y-3"
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
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-center mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.step} className="space-y-3">
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

      {/* Security attribution */}
      <section className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
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
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to understand your codebase?
        </h2>
        <p className="text-muted-foreground mb-8">
          Connect your GitHub repositories and get your first health score in minutes.
        </p>
        <Button asChild size="lg">
          <Link href="/login">
            <Github className="h-5 w-5 mr-2" />
            Get started for free
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>DevPulse</span>
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
