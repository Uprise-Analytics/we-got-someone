'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import Navbar from '@/components/Navbar'

export default function ContactPage() {
  const router = useRouter()
  const captchaRef = useRef<HCaptcha>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaSize, setCaptchaSize] = useState<'normal' | 'compact'>('normal')

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setCaptchaSize(mq.matches ? 'compact' : 'normal')
    const handler = (e: MediaQueryListEvent) => {
      setCaptchaSize(e.matches ? 'compact' : 'normal')
      setCaptchaToken('')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Please complete the captcha.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('access_key', '91c5c9c7-0582-4722-a455-4348313f4e19')
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('message', message)
    formData.append('h-captcha-response', captchaToken)
    formData.append('subject', `New message from ${name} - We Got Someone`)

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError('Something went wrong. Please try again.')
      captchaRef.current?.resetCaptcha()
      return
    }

    router.push('/contact/thank-you')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar variant="public" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Contact Us</h1>
            <p className="text-gray-500 text-sm">Got a problem or question? Send us a message and we will get back to you.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cell number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 072 123 4567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what is going on..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="flex justify-center py-1">
              <HCaptcha
                key={captchaSize}
                sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"
                size={captchaSize}
                reCaptchaCompat={false}
                onVerify={token => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                ref={captchaRef}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send message'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
