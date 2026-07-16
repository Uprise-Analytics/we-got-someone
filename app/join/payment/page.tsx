import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { PAYFAST_URL, PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE, generateSignature } from '@/lib/payfast'
import PayFastForm from './PayFastForm'
import DevActivateButton from './DevActivateButton'
import PromoCodeForm from './PromoCodeForm'

export default async function PaymentPage() {
  const cookieStore = await cookies()
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) redirect('/join')

  const { data: worker } = await serverSupabase
    .from('workers')
    .select('id, name, is_active')
    .eq('user_id', user.id)
    .single()

  if (!worker) redirect('/join')
  if (worker.is_active) redirect('/dashboard')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const paymentData: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${baseUrl}/join/success`,
    cancel_url: `${baseUrl}/join/payment`,
    notify_url: `${baseUrl}/api/payfast/notify`,
    name_first: worker.name.split(' ')[0],
    name_last: worker.name.split(' ').slice(1).join(' ') || '-',
    email_address: user.email!,
    m_payment_id: worker.id,
    amount: '99.00',
    item_name: 'We Got Someone Monthly Listing',
    subscription_type: '1',
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: '99.00',
    frequency: '3',
    cycles: '0',
  }

  const signature = generateSignature(paymentData, PAYFAST_PASSPHRASE)

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 sm:px-6 bg-gray-50 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost there, {worker.name.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mb-2">Your profile is saved. Pay R99 to go live.</p>
        <p className="text-xs text-gray-400 mb-8">You will be billed R99 every month. Cancel anytime.</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">We Got Someone Monthly Listing</span>
            <span className="font-semibold">R99.00/month</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Recurring subscription</span>
            <span>Cancel anytime</span>
          </div>
        </div>

        <PayFastForm
          action={PAYFAST_URL}
          fields={{ ...paymentData, signature }}
        />

        <PromoCodeForm />

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Dev mode only</p>
            <DevActivateButton />
          </div>
        )}
      </div>
    </div>
  )
}
