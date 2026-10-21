'use client'

import { useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

type Props = {
  file: File
  aspect: number
  round?: boolean
  outputWidth: number
  title: string
  onCancel: () => void
  onSave: (cropped: File) => void
}

async function cropToFile(src: string, area: Area, outputWidth: number, aspect: number): Promise<File> {
  const img = new Image()
  img.src = src
  await img.decode()

  const width = Math.min(outputWidth, Math.round(area.width))
  const height = Math.round(width / aspect)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  // JPEG has no transparency, so logos with clear backgrounds sit on white instead of black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, width, height)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('Could not process image')
  return new File([blob], 'image.jpg', { type: 'image/jpeg' })
}

export default function ImageCropper({ file, aspect, round, outputWidth, title, onCancel, onSave }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const url = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => { if (active) setSrc(url) }
    probe.onerror = () => { if (active) setFailed(true) }
    probe.src = url
    return () => {
      active = false
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onCancel])

  async function handleSave() {
    if (!src || !area) return
    setSaving(true)
    try {
      onSave(await cropToFile(src, area, outputWidth, aspect))
    } catch {
      setFailed(true)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 pt-4 pb-3 text-center">
          <p className="font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">Drag to move. Use the slider to zoom.</p>
        </div>

        <div className="relative w-full h-72 sm:h-80 bg-gray-900">
          {failed ? (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-sm text-gray-200">This photo could not be opened. Please choose a JPG or PNG image.</p>
            </div>
          ) : src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={round ? 'round' : 'rect'}
              showGrid={!round}
              minZoom={1}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="px-5 pt-4 pb-5 space-y-4" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          {!failed && (
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
              </svg>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                aria-label="Zoom"
                className="flex-1 accent-green-600 cursor-pointer"
              />
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={failed || !area || saving}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
