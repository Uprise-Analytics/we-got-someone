'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { META_PIXEL_ID, fbTrack } from '@/lib/pixel'

// Loads the Meta Pixel once and sends a PageView on every page change (admin pages excluded).
export default function MetaPixel() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const first = useRef(true)

  // The first PageView is sent by the loader script below (fbq does not exist yet on first render).
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (pathname.startsWith('/admin')) return
    fbTrack('PageView')
  }, [pathname, search])

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
try{if(localStorage.getItem('wgs_owner')!=='1'&&!location.pathname.startsWith('/admin'))fbq('track','PageView')}catch(e){fbq('track','PageView')}`}
    </Script>
  )
}
