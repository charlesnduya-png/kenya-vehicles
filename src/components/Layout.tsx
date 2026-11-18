import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SITE_CAPTION, SITE_DESCRIPTION, SITE_TITLE } from '../lib/siteSeo'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { SiteAnnouncement } from './SiteAnnouncement'

const pageTitles: Record<string, string> = {
  '/': SITE_TITLE,
  '/cars': `Buy Cars | ${SITE_TITLE}`,
  '/rentals': `Car Hire | ${SITE_TITLE}`,
  '/dealers': `Verified Dealers | ${SITE_TITLE}`,
  '/loans': `Car Loans | ${SITE_TITLE}`,
  '/pricing': `Pricing | ${SITE_TITLE}`,
  '/join': `Sell on Kenya Vehicles | ${SITE_TITLE}`,
  '/login': `Sign in | Kenya Vehicles`,
  '/about': `About | ${SITE_TITLE}`,
  '/architecture': `Platform | Kenya Vehicles`,
  '/messages': `Messages | Kenya Vehicles`,
  '/report': `Report an account | Kenya Vehicles`,
}

function syncDocumentMeta(pathname: string) {
  const exact = pageTitles[pathname]
  const matched =
    exact ||
    (pathname.startsWith('/cars/')
      ? `Car for sale | ${SITE_TITLE}`
      : pathname.startsWith('/rentals/')
        ? `Car hire | ${SITE_TITLE}`
        : pathname.startsWith('/dealers/')
          ? `Dealer yard | ${SITE_TITLE}`
          : SITE_TITLE)

  document.title = matched

  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', SITE_DESCRIPTION)

  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) ogTitle.setAttribute('content', matched)

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) ogDescription.setAttribute('content', SITE_CAPTION)
}

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    syncDocumentMeta(pathname)
  }, [pathname])

  return (
    <>
      <SiteAnnouncement />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
