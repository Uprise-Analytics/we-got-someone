import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Yourself as a Worker – First Month Free',
  description: 'Create your worker profile and get found by homeowners in your area. List your skills, set your rate, and start getting jobs. First month free, then R59/month.',
  alternates: { canonical: '/join' },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
