'use client'

import { useEffect, useState } from 'react'

interface AnimatedScoreProps {
  score: number
  className?: string
}

export default function AnimatedScore({ score, className }: AnimatedScoreProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 800
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * score)
      setDisplay(start)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  return <span className={className}>{display}</span>
}
