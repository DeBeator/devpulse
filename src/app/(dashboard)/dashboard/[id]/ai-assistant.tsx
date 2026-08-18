'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'


interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Summarize this repository health',
  'What should I fix first?',
  'Why is my score low?',
  'What needs attention?',
]

export default function AIAssistant({
  repositoryId,
}: {
  repositoryId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/repositories/${repositoryId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'AI request failed')
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.reply },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask me anything about this repository.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}

              </div>

            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-3 py-2 text-sm bg-secondary">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          placeholder="Ask about this repository..."
          className="flex-1 text-sm bg-background border rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
