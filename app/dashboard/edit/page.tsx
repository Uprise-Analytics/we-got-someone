import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EditProfileForm from './EditProfileForm'
import Navbar from '@/components/Navbar'
import TradePattern from '@/components/TradePattern'

export default async function EditProfilePage() {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) redirect('/join')

  const { data: worker, error: workerError } = await serverSupabase
    .from('workers')
    .select('id, user_id, name, bio, skills, city, area, phone, photo_url, daily_rate, available_now, gender, date_of_birth, languages, own_transport, years_experience, service_areas, work_photos')
    .eq('user_id', user.id)
    .single()

  // Fallback: if new columns don't exist yet (migration pending), fetch without them
  const workerData = workerError
    ? (await serverSupabase
        .from('workers')
        .select('id, user_id, name, bio, skills, city, area, phone, photo_url, daily_rate, available_now')
        .eq('user_id', user.id)
        .single()).data
    : worker

  if (!workerData) redirect('/join')

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50">
      <TradePattern />
      <Navbar variant="back" href="/dashboard" label="Back" />

      <div className="relative max-w-lg mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Edit your profile</h1>
          <p className="text-gray-400 text-sm mt-0.5">Changes go live immediately</p>
        </div>
        <EditProfileForm worker={workerData as any} />
      </div>
    </div>
  )
}
