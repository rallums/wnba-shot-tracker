'use client'

import { useState } from 'react'

export default function ShareLink({ playerId, compareId }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const params = new URLSearchParams()
    if (playerId) params.set('player', playerId)
    if (compareId) params.set('compare', compareId)
    const url = `${window.location.origin}${params.toString() ? `?${params}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="h-9 px-3 rounded-lg text-[11px] font-black border border-wnba-border text-wnba-muted hover:text-wnba-text transition-colors flex-shrink-0"
      aria-label="Copy shareable link"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
