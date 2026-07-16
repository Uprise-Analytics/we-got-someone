import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Privacy Policy | We Got Someone',
}

const SECTIONS = [
  {
    heading: 'Who we are',
    body: `We Got Someone is an online labour marketplace that connects homeowners and individuals with informal day workers in South Africa. We operate under South African law, including the Protection of Personal Information Act (POPIA), Act 4 of 2013.`,
  },
  {
    heading: 'What information we collect',
    body: `For workers who list a profile, we collect your name, phone number, photo, skills, location, and payment information processed through PayFast. For visitors who use the search function, we do not require any personal information. If you leave a review, you may optionally provide your name.`,
  },
  {
    heading: 'Why we collect it',
    body: `We use your information to create and display your worker profile, process your monthly subscription payment, allow homeowners to find and contact you, and improve the service. We do not sell your personal information to third parties.`,
  },
  {
    heading: 'How we store it',
    body: `All data is stored on secure servers via Supabase (hosted in the EU/US). Payment processing is handled by PayFast, a PCI DSS-compliant South African payment provider. We do not store card details. Worker photos are stored in secure cloud storage.`,
  },
  {
    heading: 'Who can see your information',
    body: `Your worker profile (name, photo, skills, area, and contact number) is public. That is the purpose of the listing. Your email address and billing details are never shown publicly. Reviewers see only the name you choose to provide when writing a review.`,
  },
  {
    heading: 'Your rights under POPIA',
    body: `You have the right to access the personal information we hold about you, to correct inaccurate information, to request deletion of your account and data, and to object to how we process your information. To exercise any of these rights, contact us at the address below.`,
  },
  {
    heading: 'Cookies',
    body: `We use session cookies to keep you logged in as a worker. We do not use advertising cookies or track you across other websites.`,
  },
  {
    heading: 'Third-party links',
    body: `Worker profiles include WhatsApp and phone links that take you outside our platform. We are not responsible for the privacy practices of external services.`,
  },
  {
    heading: 'Changes to this policy',
    body: `We may update this policy from time to time. Changes will be published on this page with a revised date. Continued use of the service after changes means you accept the updated policy.`,
  },
  {
    heading: 'Contact us',
    body: `For any privacy-related questions or requests, contact us at: info@gotsomeone.co.za`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar variant="public" />

      {/* Header */}
      <section className="bg-[#0D1B2A] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Effective date: 1 July 2025 &nbsp;·&nbsp; Last updated: July 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <p className="text-gray-600 text-base leading-relaxed border-l-4 border-green-500 pl-5">
            We Got Someone is committed to protecting your personal information. This policy explains what we collect, why, and how you can control it. Plain language, not legal jargon.
          </p>

          {SECTIONS.map(({ heading, body }) => (
            <div key={heading}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{heading}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-white">
            We Got <span className="text-green-400">Someone</span>
          </span>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            <Link href="/workers" className="hover:text-gray-300">Find a worker</Link>
            <Link href="/join" className="hover:text-gray-300">List yourself</Link>
            <Link href="/sign-in" className="hover:text-gray-300">Sign in</Link>
            <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          </div>
          <span className="text-xs text-gray-600 text-center">© {new Date().getFullYear()} We Got Someone</span>
        </div>
      </footer>
    </div>
  )
}
