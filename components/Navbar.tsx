import Link from 'next/link'
import NavMenu from './NavMenu'

type NavbarProps =
  | { variant: 'public' }
  | { variant: 'minimal' }
  | { variant: 'back'; href: string; label: string }
  | { variant: 'dashboard'; profileHref: string; signOutSlot: React.ReactNode }

export default function Navbar(props: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-base sm:text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">
          We Got <span className="text-green-600">Someone</span>
        </Link>

        {props.variant === 'public' && <NavMenu />}

        {props.variant === 'minimal' && null}

        {props.variant === 'back' && (
          <Link
            href={props.href}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {props.label}
          </Link>
        )}

        {props.variant === 'dashboard' && (
          <div className="flex items-center gap-4">
            {props.signOutSlot}
          </div>
        )}
      </div>
    </nav>
  )
}
