'use client'

import { useState, useEffect, useCallback } from 'react'

export default function PhotoGallery({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null

  const prev = useCallback(() => setIndex(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const next = useCallback(() => setIndex(i => (i !== null && i < photos.length - 1 ? i + 1 : i)), [photos.length])
  const close = useCallback(() => setIndex(null), [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, prev, next, close])

  if (!photos.length) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in"
            onClick={() => setIndex(i)}
          >
            <img
              src={url}
              alt={`Work photo ${i + 1}`}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>
        ))}
      </div>

      {open && index !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-5 text-white text-4xl leading-none hover:text-gray-300 cursor-pointer z-10"
            onClick={close}
          >
            ×
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {index + 1} / {photos.length}
          </span>

          {/* Prev arrow */}
          {index > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer transition-colors"
              onClick={e => { e.stopPropagation(); prev() }}
            >
              ‹
            </button>
          )}

          <img
            src={photos[index]}
            alt={`Work photo ${index + 1}`}
            className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Next arrow */}
          {index < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer transition-colors"
              onClick={e => { e.stopPropagation(); next() }}
            >
              ›
            </button>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setIndex(i) }}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${i === index ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
