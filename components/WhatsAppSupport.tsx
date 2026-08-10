'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

const PHONE = '27621317657'

const ISSUES = [
  { emoji: '💳', label: 'Payment issue' },
  { emoji: '👤', label: 'Profile issue' },
  { emoji: '🔧', label: 'Technical problem' },
  { emoji: '❓', label: 'General question' },
]

export default function WhatsAppSupport() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleIssue(label: string) {
    setBusy(true)
    const { data: { session } } = await supabase.auth.getSession()

    let msg = `Hi, I need help with We Got Someone.\n\nIssue: ${label}`
    if (session?.user?.email) msg += `\nEmail: ${session.user.email}`

    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank')
    setOpen(false)
    setBusy(false)
  }

  return (
    <>
      {/* Popup card */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[9998] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#075E54' }}>
            <div className="flex items-center gap-2.5">
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">We Got Someone Support</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">What do you need help with?</p>
            <div className="space-y-2">
              {ISSUES.map(issue => (
                <button
                  key={issue.label}
                  onClick={() => handleIssue(issue.label)}
                  disabled={busy}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-300 text-left text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-base">{issue.emoji}</span>
                  {issue.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Opens WhatsApp · We reply within 24 hours</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9998] w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        style={{ background: '#25D366' }}
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </button>
    </>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
