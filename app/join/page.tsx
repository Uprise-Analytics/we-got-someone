'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import AreaSelect from '@/components/AreaSelect'
import Spinner from '@/components/Spinner'
import TradePattern from '@/components/TradePattern'

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50'

function CardSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{label}</p>
      {children}
    </div>
  )
}

const SKILLS = [
  'Air Conditioning', 'Bathroom Renovation', 'Blinds & Curtains', 'Brick Layer',
  'Carpenter', 'CCTV & Intercom', 'Ceiling', 'Cleaner', 'Domestic Worker',
  'Drain Cleaning', 'Electrician', 'Flooring', 'Gardener', 'Handyman',
  'Garage Door Specialist', 'Glass Specialist', 'IT Specialist', 'Kitchen Installer', 'Landscaping', 'Mechanic', 'Moving & Transport', 'Painter',
  'Panel Beater', 'Paving', 'Pest Control', 'Plastering', 'Plumber', 'Pool & Spa',
  'Roofing', 'Rubble Removal', 'Security', 'Solar Installation',
  'Tiler', 'Tree Felling', 'Waterproofing', 'Welding',
]

const LANGUAGES = [
  'English', 'Zulu', 'Xhosa', 'Afrikaans', 'Sotho',
  'Tswana', 'Venda', 'Tsonga', 'Pedi', 'Ndebele', 'Swati',
]

type Step = 'account' | 'profile'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')
  const stepRef = useRef(step)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  // Account fields — stored in state, auth user created on final submit
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Profile fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [languages, setLanguages] = useState<string[]>([])
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')

  // Keep ref in sync so popstate handler never has a stale closure
  useEffect(() => { stepRef.current = step }, [step])

  // When entering step 2, push a dummy history entry so browser back can be caught
  useEffect(() => {
    if (step === 'profile') {
      window.history.pushState(null, '')
    }
  }, [step])

  // Intercept browser back button on step 2 — go to step 1 instead of leaving
  useEffect(() => {
    function handlePopState() {
      if (stepRef.current === 'profile') {
        setStep('account')
        window.history.pushState(null, '') // keep the dummy entry so repeated back presses still work
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Restore draft on mount + detect if user already signed up (coming back from payment page)
  useEffect(() => {
    try {
      // Capture ?ref= referral code from URL
      const refCode = new URLSearchParams(window.location.search).get('ref')
      if (refCode) setReferralCode(refCode)
    } catch {}

    try {
      const saved = sessionStorage.getItem('wgs_join_draft')
      if (saved) {
        const d = JSON.parse(saved)
        if (d.email) setEmail(d.email)
        if (d.name) setName(d.name)
        if (d.bio) setBio(d.bio)
        if (d.phone) setPhone(d.phone)
        if (d.contactEmail) setContactEmail(d.contactEmail)
        if (d.website) setWebsite(d.website)
        if (d.skills?.length) setSkills(d.skills)
        if (d.languages?.length) setLanguages(d.languages)
        if (d.serviceAreas?.length) setServiceAreas(d.serviceAreas)
      }
    } catch {}

    // If the user is already signed in, skip to step 2
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setSessionUserId(session.user.id)
      setEmail(session.user.email ?? '')
      const { data: worker } = await supabase
        .from('workers')
        .select('name, bio, skills, phone, email, website, languages, service_areas, photo_url, banner_url')
        .eq('user_id', session.user.id)
        .single()
      if (!worker) {
        // Signed in but no profile yet (e.g. came from dashboard redirect) — skip auth step
        setStep('profile')
        return
      }
      setIsEditMode(true)
      setName(prev => prev || (worker.name ?? ''))
      setBio(prev => prev || (worker.bio ?? ''))
      setPhone(prev => prev || (worker.phone ?? ''))
      setContactEmail(prev => prev || (worker.email ?? ''))
      setWebsite(prev => prev || (worker.website ?? ''))
      setSkills(prev => prev.length ? prev : (worker.skills ?? []))
      setLanguages(prev => prev.length ? prev : (worker.languages ?? []))
      setServiceAreas(prev => prev.length ? prev : (worker.service_areas ?? []))
      if (worker.photo_url) {
        setExistingPhotoUrl(worker.photo_url)
        setPhotoPreview(prev => prev || worker.photo_url)
      }
      if (worker.banner_url) {
        setExistingBannerUrl(worker.banner_url)
        setBannerPreview(prev => prev || worker.banner_url)
      }
      setStep('profile')
    })
  }, [])

  // Auto-save draft as user types
  useEffect(() => {
    if (!email && !name) return
    try {
      sessionStorage.setItem('wgs_join_draft', JSON.stringify({
        email, name, bio, phone, contactEmail, website,
        skills, languages, serviceAreas,
      }))
    } catch {}
  }, [step, email, name, bio, phone, contactEmail, website, skills, languages, serviceAreas])

  function toggleSkill(skill: string) {
    if (skills.includes(skill)) {
      setSkills(prev => prev.filter(s => s !== skill))
    } else if (skills.length < 3) {
      setSkills(prev => [...prev, skill])
    }
  }

  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBanner(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setStep('profile')
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (skills.length === 0) { setError('Please select at least one skill.'); return }
    if (serviceAreas.length === 0) { setError('Please select at least one area you work in.'); return }
    setLoading(true)
    setError('')
    setAlreadyRegistered(false)

    // Edit mode: user already exists, just update their profile and go back to payment
    if (isEditMode) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Session expired. Please sign in again.'); setLoading(false); return }
      const uid = session.user.id

      let photoUrl = existingPhotoUrl
      if (photo) {
        const ext = photo.name.split('.').pop()
        const { error: upErr } = await supabase.storage.from('worker-photos').upload(`${uid}.${ext}`, photo, { upsert: true })
        if (!upErr) {
          const { data: u } = supabase.storage.from('worker-photos').getPublicUrl(`${uid}.${ext}`)
          photoUrl = u.publicUrl
        }
      }

      let bannerUrl = existingBannerUrl
      if (banner) {
        const ext = banner.name.split('.').pop()
        const { error: upErr } = await supabase.storage.from('worker-photos').upload(`${uid}-banner.${ext}`, banner, { upsert: true })
        if (!upErr) {
          const { data: u } = supabase.storage.from('worker-photos').getPublicUrl(`${uid}-banner.${ext}`)
          bannerUrl = u.publicUrl
        }
      }

      const { error: updateErr } = await supabase.from('workers').update({
        name, bio, skills, phone,
        photo_url: photoUrl,
        banner_url: bannerUrl,
        email: contactEmail || null,
        website: website || null,
        languages,
        service_areas: serviceAreas,
      }).eq('user_id', uid)

      setLoading(false)
      if (updateErr) { setError(updateErr.message); return }
      router.push('/dashboard')
      return
    }

    // Already signed in but no profile yet — create it now, no signUp needed
    if (sessionUserId) {
      const uid = sessionUserId
      let photoUrl: string | null = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const { error: upErr } = await supabase.storage.from('worker-photos').upload(`${uid}.${ext}`, photo, { upsert: true })
        if (!upErr) {
          const { data: u } = supabase.storage.from('worker-photos').getPublicUrl(`${uid}.${ext}`)
          photoUrl = u.publicUrl
        }
      }
      let bannerUrl: string | null = null
      if (banner) {
        const ext = banner.name.split('.').pop()
        const { error: upErr } = await supabase.storage.from('worker-photos').upload(`${uid}-banner.${ext}`, banner, { upsert: true })
        if (!upErr) {
          const { data: u } = supabase.storage.from('worker-photos').getPublicUrl(`${uid}-banner.${ext}`)
          bannerUrl = u.publicUrl
        }
      }
      let utmSource: string | null = null, utmMedium: string | null = null
      let utmCampaign: string | null = null, utmContent: string | null = null
      try {
        utmSource = sessionStorage.getItem('utm_source')
        utmMedium = sessionStorage.getItem('utm_medium')
        utmCampaign = sessionStorage.getItem('utm_campaign')
        utmContent = sessionStorage.getItem('utm_content')
      } catch {}
      const res = await fetch('/api/workers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid, name, bio, skills, phone, photoUrl, bannerUrl,
          email: contactEmail || null, website: website || null,
          languages, serviceAreas,
          referralCode: referralCode || null,
          utmSource, utmMedium, utmCampaign, utmContent,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }
      try { sessionStorage.removeItem('wgs_join_draft') } catch {}
      setLoading(false)
      router.push('/dashboard')
      return
    }

    // Brand new signup — create Supabase auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://www.wegotsomeone.co.za/auth/callback?next=/confirmed',
      },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (!authData.user) {
      setError('Could not create account. Please try again.')
      setLoading(false)
      return
    }
    // Empty identities = email already registered. Show "already registered" instead of
    // passing a fake UUID to the API which would return 401.
    if ((authData.user.identities?.length ?? 0) === 0) {
      setAlreadyRegistered(true)
      setLoading(false)
      return
    }
    const uid = authData.user.id
    const needsEmailConfirmation = !authData.session

    // Without a session (email not confirmed yet) storage rejects direct uploads,
    // so ask the server for a one-time upload link instead.
    async function uploadImage(file: File, kind: 'photo' | 'banner'): Promise<string | null> {
      let path: string
      let uploadError: unknown
      if (needsEmailConfirmation) {
        const res = await fetch('/api/workers/photo-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, kind, contentType: file.type }),
        })
        if (!res.ok) return null
        const { path: signedPath, token } = await res.json()
        path = signedPath
        ;({ error: uploadError } = await supabase.storage.from('worker-photos').uploadToSignedUrl(path, token, file, { contentType: file.type }))
      } else {
        const ext = file.name.split('.').pop()
        path = kind === 'photo' ? `${uid}.${ext}` : `${uid}-banner.${ext}`
        ;({ error: uploadError } = await supabase.storage.from('worker-photos').upload(path, file, { upsert: true }))
      }
      if (uploadError) return null
      return supabase.storage.from('worker-photos').getPublicUrl(path).data.publicUrl
    }

    const photoUrl = photo ? await uploadImage(photo, 'photo') : null
    const bannerUrl = banner ? await uploadImage(banner, 'banner') : null

    // Read UTM params saved by UtmCapture component
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null
    let utmContent: string | null = null
    try {
      utmSource = sessionStorage.getItem('utm_source')
      utmMedium = sessionStorage.getItem('utm_medium')
      utmCampaign = sessionStorage.getItem('utm_campaign')
      utmContent = sessionStorage.getItem('utm_content')
    } catch {}

    const profilePayload = {
      userId: uid, name, bio, skills, phone,
      photoUrl, bannerUrl,
      email: contactEmail || null,
      website: website || null,
      languages,
      serviceAreas,
      referralCode: referralCode || null,
      utmSource, utmMedium, utmCampaign, utmContent,
    }

    // Use the unconfirmed route when there is no session yet (email confirmation pending)
    const createEndpoint = needsEmailConfirmation
      ? '/api/workers/create-unconfirmed'
      : '/api/workers/create'

    const res = await fetch(createEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload),
    })

    if (!res.ok) {
      if (res.status === 409) {
        setAlreadyRegistered(true)
        setLoading(false)
        return
      }
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    try { sessionStorage.removeItem('wgs_join_draft') } catch {}

    if (needsEmailConfirmation) {
      // Store credentials so the check-email page can auto-sign-in after cross-device confirmation.
      try {
        sessionStorage.setItem('wgs_email', email)
        sessionStorage.setItem('wgs_password', password)
      } catch {}
      router.push(`/join/check-email?email=${encodeURIComponent(email)}&uid=${uid}`)
    } else {
      router.push('/join/success')
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="minimal" />

      <div className="relative max-w-lg mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1">
        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'account' ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'account' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            Create Account
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'profile' ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'profile' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            Your Profile
          </div>
        </div>

        {step === 'account' && (
          <>
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Create your account</h1>
              <p className="text-gray-400 text-sm mt-0.5">Free to list. No credit card required.</p>
            </div>

            <form onSubmit={handleAccountSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => {
                  if (email && email.includes('@')) {
                    try {
                      fetch('/api/leads/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, utm_source: sessionStorage.getItem('utm_source') }),
                      })
                    } catch {}
                  }
                }}
                required
                className={INPUT}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min. 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${INPUT} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 cursor-pointer shadow-sm"
              >
                Continue
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <a href="/sign-in" className="text-green-600 font-medium hover:underline">Sign in</a>
            </p>
          </>
        )}

        {step === 'profile' && (
          <>
            <button
              type="button"
              onClick={() => setStep('account')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
            >
              ← Back
            </button>
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Build your profile</h1>
              <p className="text-gray-400 text-sm mt-0.5">This is what clients will see when they find you</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">

              {/* ── Profile ── */}
              <CardSection label="Profile">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 text-center">Cover photo <span className="text-gray-400 font-normal">(optional)</span></p>
                  <label className="relative block cursor-pointer group rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors" style={{ aspectRatio: '3/1' }}>
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Add a cover photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">{bannerPreview ? 'Change cover photo' : 'Add cover photo'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1 text-center">Wide photo of your work, premises or team</p>
                </div>

                <div className="flex flex-col items-center">
                  <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                          {name.trim() ? name.trim()[0].toUpperCase() : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Tap to add your photo or logo</p>
                </div>

                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className={INPUT}
                />

                <textarea
                  placeholder="Short bio. Tell clients what makes you great."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className={`${INPUT} resize-none`}
                />
              </CardSection>

              {/* ── Skills ── */}
              <CardSection label="What you do">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Pick up to 3 skills, strongest first.</p>
                  <span className="text-xs font-bold text-gray-400">{skills.length}/3 selected</span>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {skills.map((s, i) => (
                      <div key={s} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                        <span className="text-xs font-bold text-green-600 w-16 flex-shrink-0">{['Primary', 'Secondary', 'Tertiary'][i]}</span>
                        <span className="text-sm font-medium text-green-800 flex-1">{s}</span>
                        <button type="button" onClick={() => toggleSkill(s)} className="text-green-400 hover:text-green-700 cursor-pointer text-xl leading-none">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  {SKILLS.filter(s => !skills.includes(s)).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      disabled={skills.length >= 3}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        skills.length >= 3
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'border-gray-200 text-gray-600 bg-white hover:border-green-400 hover:text-green-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {skills.length >= 3 && (
                  <p className="text-xs text-gray-400 text-center">Max 3 reached. Remove one to swap.</p>
                )}
              </CardSection>

              {/* ── Languages & Areas ── */}
              <CardSection label="Languages & Areas">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">Languages spoken</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {LANGUAGES.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLanguage(l)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                          languages.includes(l)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-600 bg-white hover:border-blue-400'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <AreaSelect
                  selected={serviceAreas}
                  onChange={setServiceAreas}
                  label="Areas you work in (choose more than 1)"
                />
              </CardSection>

              {/* ── Contact details ── */}
              <CardSection label="Contact details">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 062 131 7657"
                    value={phone}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                      let formatted = digits
                      if (digits.length > 6) formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
                      else if (digits.length > 3) formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`
                      setPhone(formatted)
                    }}
                    required
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="email"
                    placeholder="e.g. info@yourcompany.co.za"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. www.yourcompany.co.za"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    onBlur={e => {
                      const v = e.target.value.trim()
                      if (v && !v.startsWith('http://') && !v.startsWith('https://')) setWebsite('https://' + v)
                    }}
                    className={INPUT}
                  />
                </div>
              </CardSection>

              {alreadyRegistered && (
                <p className="text-red-500 text-sm text-center px-1">
                  This email is already registered.{' '}
                  <Link href="/sign-in" className="underline font-semibold">Sign in instead</Link>
                </p>
              )}
              {!alreadyRegistered && error && <p className="text-red-500 text-sm text-center px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white font-semibold py-4 rounded-2xl hover:bg-green-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading && <Spinner />}
                {loading ? 'Creating your profile...' : 'Create my profile'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
