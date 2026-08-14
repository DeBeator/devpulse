import { createHmac, timingSafeEqual } from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const sig = Buffer.from(signature, 'utf-8')
  const hmac = createHmac('sha256', secret)
  hmac.update(payload, 'utf-8')
  const digest = Buffer.from(`sha256=${hmac.digest('hex')}`, 'utf-8')

  if (sig.length !== digest.length) return false

  try {
    return timingSafeEqual(sig, digest)
  } catch {
    return false
  }
}

export type GitHubWebhookEvent =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'release'
  | 'pull_request_review'
  | 'ping'

export interface WebhookPayload {
  action?: string
  repository?: {
    id: number
    full_name: string
    owner: {
      login: string
    }
  }
}
