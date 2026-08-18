export interface RepositoryContext {
  repository: {
    name: string
    full_name: string
    description: string | null
    language: string | null
  }
  health: {
    overall: number
    activity: number
    pull_requests: number
    issues: number
    security: number
    releases: number
    contributors: number
    documentation: number
    calculated_at: string
  } | null
  insights: Array<{
    severity: string
    category: string
    title: string
    description: string
    recommendation: string
  }>
  security: {
    findings_count: number
    critical_count: number
    high_count: number
  }
  stats: {
    total_commits: number
    open_prs: number
    merged_prs: number
    stale_prs: number
    open_issues: number
    closed_issues: number
    total_releases: number
    contributor_count: number
  }
}

export function buildSystemPrompt(context: RepositoryContext): string {
  return `You are DevPulse AI, an intelligent assistant that helps developers understand their repository health and what needs attention.

You have access to real data about the repository "${context.repository.full_name}".

REPOSITORY DATA:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
- Answer questions based ONLY on the data provided above
- Be concise and actionable
- Prioritize the most important issues
- When recommending actions, be specific
- Never invent data that is not in the context
- If asked about something not in the data, say so clearly
- Keep responses focused and developer-friendly
- Do not use excessive markdown — plain text with minimal formatting

HEALTH SCORE WEIGHTS:
Activity: 20%, Pull Requests: 20%, Issues: 15%, Security: 20%, Releases: 10%, Contributors: 10%, Documentation: 5%`
}
