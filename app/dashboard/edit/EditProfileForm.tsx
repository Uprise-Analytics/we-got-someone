'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import AreaSelect from '@/components/AreaSelect'

const SKILLS = [
  'Painter', 'Cleaner', 'Gardener', 'Plumber', 'Electrician',
  'Tiler', 'Carpenter', 'Handyman', 'Domestic Worker', 'Brick Layer',
]

const LANGUAGES = [
  'English', 'Zulu', 'Xhosa', 'Afrikaans', 'Sotho',
  'Tswana', 'Venda', 'Tsonga', 'Pedi', 'Ndebele', 'Swati',
]

type Worker = {
  id: string
  user_id: string
  name: string
  bio: string
  skills: string[]
  city: string
  area: string
  phone: string
  photo_url: string | null
  daily_rate: number | null
  available_now: boolean
  gender?: string | null
  date_of_birth?: string | null
  languages?: string[] | null
  own_transport?: boolean
  years_experience?: number | null
  service_areas?: string[] | null
  work_photos?: string[] | null
}

function CardSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{label}</p>
      {children}
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
        on ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      <span>{label}</span>
      <span className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${on ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

export default function EditProfileForm({ worker }: { worker: Worker }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(worker.name)
  const [bio, setBio] = useState(worker.bio ?? '')
  const [skills, setSkills] = useState<string[]>(worker.skills ?? [])
  const [phone, setPhone] = useState(worker.phone)
  const [dailyRate, setDailyRate] = useState(worker.daily_rate?.toString() ?? '')
  const [availableNow, setAvailableNow] = useState(worker.available_now ?? false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(worker.photo_url)
  const [gender, setGender] = useState(worker.gender ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(worker.date_of_birth ?? '')
  const [languages, setLanguages] = useState<string[]>(worker.languages ?? [])
  const [ownTransport, setOwnTransport] = useState(worker.own_transport ?? false)
  const [yearsExperience, setYearsExperience] = useState(worker.years_experience?.toString() ?? '')
  const [workPhotos, setWorkPhotos] = useState<string[]>(worker.work_photos ?? [])
  const [uploadingWork, setUploadingWork] = useState(false)
  const initialAreas = worker.service_areas?.length ? worker.service_areas : [worker.city].filter(Boolean)
  const [serviceAreas, setServiceAreas] = useState<string[]>(initialAreas)

  function toggleSkill(skill: string) {
    if (skills.includes(skill)) setSkills(prev => prev.filter(s => s !== skill))
    else if (skills.length < 3) setSkills(prev => [...prev, skill])
  }

  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (skills.length === 0) { setError('Please select at least one skill.'); return }
    if (serviceAreas.length === 0) { setError('Please select at least one area you work in.'); return }
    setLoading(true)
    setError('')

    let photoUrl: string | undefined = undefined
    if (photo) {
      const ext = photo.name.split('.').pop()
      const filePath = `${worker.user_id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('worker-photos').upload(filePath, photo, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('worker-photos').getPublicUrl(filePath)
        photoUrl = urlData.publicUrl
      }
    }

    const res = await fetch('/api/workers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, bio, skills, phone, photoUrl,
        dailyRate: dailyRate ? parseInt(dailyRate) : null,
        availableNow,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        languages,
        ownTransport,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        serviceAreas,
        workPhotos,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Profile ── */}
      <CardSection label="Profile">
        {/* Clickable photo */}
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer group">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                  {worker.name[0]}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              setPhoto(file)
              setPhotoPreview(URL.createObjectURL(file))
            }} className="hidden" />
          </label>
          <p className="text-xs text-gray-400 mt-2">Tap to change photo</p>
        </div>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
        />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 text-center">Gender</p>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  gender === g ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-green-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">Date of birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={e => setDateOfBirth(e.target.value)}
            max={new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>

        <textarea
          placeholder="Short bio. Tell clients what makes you great."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-gray-50"
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

        <AreaSelect selected={serviceAreas} onChange={setServiceAreas} />
      </CardSection>

      {/* ── Work details ── */}
      <CardSection label="Work details">
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>

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
              className="w-full pl-8 pr-16 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>

        <Toggle
          on={ownTransport}
          onClick={() => setOwnTransport(v => !v)}
          label="I have my own transport"
        />

        <Toggle
          on={availableNow}
          onClick={() => setAvailableNow(v => !v)}
          label="Available for work right now"
        />
      </CardSection>

      {/* ── Work photos ── */}
      <CardSection label="Work photos">
        <div className="text-center">
          <p className="text-sm text-gray-500">Show clients what you can do.</p>
          <span className="text-xs font-bold text-gray-400">{workPhotos.length}/6</span>
        </div>

        {workPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {workPhotos.map((url, i) => (
              <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt={`Work photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setWorkPhotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {workPhotos.length < 6 && (
          <label className={`flex flex-col items-center justify-center gap-1 w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors ${uploadingWork ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
            <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {uploadingWork ? 'Uploading...' : 'Add photos'}
            {!uploadingWork && <span className="text-xs">Select multiple at once</span>}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async e => {
                const files = Array.from(e.target.files ?? [])
                if (!files.length) return
                setUploadingWork(true)
                const toUpload = files.slice(0, 6 - workPhotos.length)
                const urls = await Promise.all(
                  toUpload.map(async file => {
                    const ext = file.name.split('.').pop()
                    const filePath = `${worker.user_id}/work-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                    const { error } = await supabase.storage.from('worker-photos').upload(filePath, file, { upsert: false })
                    if (error) return null
                    const { data: urlData } = supabase.storage.from('worker-photos').getPublicUrl(filePath)
                    return urlData.publicUrl
                  })
                )
                setWorkPhotos(prev => [...prev, ...(urls.filter(Boolean) as string[])])
                setUploadingWork(false)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </CardSection>

      {error && <p className="text-red-500 text-sm text-center px-1">{error}</p>}
      {success && <p className="text-green-600 text-sm font-medium text-center px-1">Saved! Redirecting...</p>}

      <button
        type="submit"
        disabled={loading || success}
        className="w-full bg-green-600 text-white font-semibold py-4 rounded-2xl hover:bg-green-700 disabled:opacity-50 cursor-pointer shadow-sm"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
