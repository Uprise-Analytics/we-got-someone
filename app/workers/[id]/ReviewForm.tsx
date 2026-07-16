'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function ReviewForm({ workerId }: { workerId: string }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !rating) {
      setError('Please enter your name and a star rating.')
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('reviews').insert({
      worker_id: workerId,
      reviewer_name: name,
      rating,
      comment,
    })

    if (err) {
      setError('Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <p className="text-green-700 font-semibold">Thanks for your review!</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-1 text-center">Leave a Review</h2>
      <p className="text-gray-400 text-xs text-center mb-5">Share your experience to help others.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-4xl touch-manipulation"
            >
              <span className={(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>

        <textarea
          placeholder="Tell others about your experience (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
