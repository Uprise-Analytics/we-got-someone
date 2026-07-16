'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import AreaSelect from '@/components/AreaSelect'

const SKILLS = [
  'Painter', 'Cleaner', 'Gardener', 'Plumber', 'Electrician',
  'Tiler', 'Carpenter', 'Handyman', 'Domestic Worker', 'Brick Layer',
]

const LANGUAGES = [
  'English', 'Zulu', 'Xhosa', 'Afrikaans', 'Sotho',
  'Tswana', 'Venda', 'Tsonga', 'Pedi', 'Ndebele', 'Swati',
]

type Step = 'account' | 'profile'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Account fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Profile fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [ownTransport, setOwnTransport] = useState(false)
  const [yearsExperience, setYearsExperience] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])

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

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (!data.user) {
      setError('Could not create account. Please try again.')
      setLoading(false)
      return
    }
    setUserId(data.user.id)
    setStep('profile')
    setLoading(false)
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (skills.length === 0) {
      setError('Please select at least one skill.')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    if (serviceAreas.length === 0) {
      setError('Please select at least one area you work in.')
      return
    }
    setLoading(true)
    setError('')

    if (!userId) {
      setError('Session expired. Please start again.')
      setLoading(false)
      return
    }

    let photoUrl: string | null = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const filePath = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('worker-photos')
        .upload(filePath, photo, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('worker-photos').getPublicUrl(filePath)
        photoUrl = urlData.publicUrl
      }
    }

    const res = await fetch('/api/workers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId, name, bio, skills, phone,
        photoUrl, dailyRate: dailyRate ? parseInt(dailyRate) : null,
        gender, dateOfBirth: dateOfBirth || null,
        languages, ownTransport,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        serviceAreas,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push('/join/payment')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar variant="minimal" />

      <div className="max-w-lg mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 flex-1">
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
            <h1 className="text-2xl font-bold mb-2 text-center">Create your account</h1>
            <p className="text-gray-500 text-sm mb-6 text-center">Get listed on We Got Someone for R99/month.</p>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min. 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                disabled={loading}
                className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'profile' && (
          <>
            <h1 className="text-2xl font-bold mb-2">Build your profile</h1>
            <p className="text-gray-500 text-sm mb-6">This is what clients will see when they find you.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm text-center px-2">No photo</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer text-sm text-green-600 font-medium hover:underline">
                    Upload photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 5MB</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Gender */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Gender</p>
                <div className="flex gap-2">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        gender === g
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-200 text-gray-600 hover:border-green-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  max={new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <textarea
                placeholder="Short bio. Tell clients about yourself and your experience"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">What do you do?</p>
                  <span className="text-xs text-gray-400">{skills.length}/3 selected</span>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {skills.map((s, i) => (
                      <div key={s} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-green-600 w-16 flex-shrink-0">{['Primary', 'Secondary', 'Tertiary'][i]}</span>
                        <span className="text-sm font-medium text-green-800 flex-1">{s}</span>
                        <button type="button" onClick={() => toggleSkill(s)} className="text-green-400 hover:text-green-700 cursor-pointer text-lg leading-none">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {SKILLS.filter(s => !skills.includes(s)).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      disabled={skills.length >= 3}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        skills.length >= 3
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {skills.length >= 3 && (
                  <p className="text-xs text-gray-400 mt-2">Maximum 3 skills reached. Remove one to change it.</p>
                )}
              </div>

              {/* Languages */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Languages spoken</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleLanguage(l)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        languages.includes(l)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <AreaSelect selected={serviceAreas} onChange={setServiceAreas} />

              <input
                type="text"
                inputMode="numeric"
                placeholder="062 131 7657"
                value={phone}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  let formatted = digits
                  if (digits.length > 6) formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
                  else if (digits.length > 3) formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`
                  setPhone(formatted)
                }}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R</span>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={dailyRate}
                    onChange={e => setDailyRate(e.target.value)}
                    min={0}
                    className="w-full pl-8 pr-16 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/day</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of experience</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={yearsExperience}
                  onChange={e => setYearsExperience(e.target.value)}
                  min={0}
                  max={60}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Own transport */}
              <button
                type="button"
                onClick={() => setOwnTransport(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  ownTransport
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 11l1.5-5h15L21 11M3 11h18M3 11l-1 4h20l-1-4" />
                  </svg>
                  I have my own transport
                </div>
                <span className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${ownTransport ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${ownTransport ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Continue to Payment'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
