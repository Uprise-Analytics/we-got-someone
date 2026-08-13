import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Yourself — First Month Free | We Got Someone',
  description: 'Get your own profile page, appear on Google, and get found by clients in your area. First month free, then R59/month. 30-day enquiry guarantee.',
  alternates: { canonical: '/join' },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
