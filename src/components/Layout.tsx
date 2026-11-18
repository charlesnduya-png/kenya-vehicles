import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { SiteAnnouncement } from './SiteAnnouncement'

export function Layout() {
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
