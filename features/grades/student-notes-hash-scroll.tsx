'use client'

import { useEffect } from 'react'

export function StudentNotesHashScroll() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash || !hash.startsWith('notes-term-')) return

    const scrollToTarget = () => {
      const el = document.getElementById(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    scrollToTarget()
    const timer = window.setTimeout(scrollToTarget, 400)
    return () => window.clearTimeout(timer)
  }, [])

  return null
}
