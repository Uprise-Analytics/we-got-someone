import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar variant="public" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-md">

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for reaching out.</h1>
          <p className="text-gray-500 text-base leading-relaxed mb-2">
            We have received your message and will get back to you as soon as possible.
          </p>
          <p className="text-gray-400 text-sm mb-10">
            We typically respond within 24 hours on business days.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/workers"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Find a worker
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Back to home
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
