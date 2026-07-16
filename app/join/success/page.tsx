import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">You are live!</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        Your profile is now visible to anyone searching for workers in your area. Start getting calls.
      </p>
      <Link
        href="/dashboard"
        className="bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700"
      >
        Go to my dashboard
      </Link>
    </div>
  )
}
