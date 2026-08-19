'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    const main = document.getElementById('main-scroll')
    if (main) {
      main.scrollTop = 0
    }
  }, [pathname])

  return null
}
