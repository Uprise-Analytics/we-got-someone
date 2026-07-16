'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="cursor-pointer text-sm text-gray-500 hover:text-gray-900"
    >
      Sign out
    </button>
  )
}
