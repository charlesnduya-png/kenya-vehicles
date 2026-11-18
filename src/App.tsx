import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './data/partnerRegistry'
import './data/dealerBadges'
import { AdminAccounts } from './admin/AdminAccounts'
import { AdminAnalytics } from './admin/AdminAnalytics'
import { AdminAnnouncements } from './admin/AdminAnnouncements'
import { AdminBilling } from './admin/AdminBilling'
import { AdminCars } from './admin/AdminCars'
import { AdminDealers } from './admin/AdminDealers'
import { AdminEnquiries } from './admin/AdminEnquiries'
import { AdminLayout } from './admin/AdminLayout'
import { AdminLoans } from './admin/AdminLoans'
import { AdminOverview } from './admin/AdminOverview'
import { AdminRentals } from './admin/AdminRentals'
import { AdminReports } from './admin/AdminReports'
import { DealerEnquiries } from './dealer/DealerEnquiries'
import { DealerInventory } from './dealer/DealerInventory'
import { DealerLayout } from './dealer/DealerLayout'
import { DealerMessages } from './dealer/DealerMessages'
import { DealerOffers } from './dealer/DealerOffers'
import { DealerOverview } from './dealer/DealerOverview'
import { DealerProfile } from './dealer/DealerProfile'
import { DealerRentals } from './dealer/DealerRentals'
import { DealerSubscription } from './dealer/DealerSubscription'
import { LenderAnalytics } from './lender/LenderAnalytics'
import { LenderApplications } from './lender/LenderApplications'
import { LenderLayout } from './lender/LenderLayout'
import { LenderOverview } from './lender/LenderOverview'
import { LenderProfile } from './lender/LenderProfile'
import { LenderSubscription } from './lender/LenderSubscription'
import { Layout } from './components/Layout'
import { Browse } from './pages/Browse'
import { CarDetail } from './pages/CarDetail'
import { DealerDetail } from './pages/DealerDetail'
import { Dealers } from './pages/Dealers'
import { About } from './pages/About'
import { Architecture } from './pages/Architecture'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { Loans } from './pages/Loans'
import { Login } from './pages/Login'
import { Messages } from './pages/Messages'
import { Pricing } from './pages/Pricing'
import { RentalDetail } from './pages/RentalDetail'
import { Rentals } from './pages/Rentals'
import { ReportAccount } from './pages/ReportAccount'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="cars" element={<AdminCars />} />
          <Route path="rentals" element={<AdminRentals />} />
          <Route path="dealers" element={<AdminDealers />} />
          <Route path="loans" element={<AdminLoans />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route path="dealer" element={<DealerLayout />}>
          <Route index element={<DealerOverview />} />
          <Route path="inventory" element={<DealerInventory />} />
          <Route path="rentals" element={<DealerRentals />} />
          <Route path="enquiries" element={<DealerEnquiries />} />
          <Route path="offers" element={<DealerOffers />} />
          <Route path="messages" element={<DealerMessages />} />
          <Route path="subscription" element={<DealerSubscription />} />
          <Route path="profile" element={<DealerProfile />} />
        </Route>

        <Route path="lender" element={<LenderLayout />}>
          <Route index element={<LenderOverview />} />
          <Route path="applications" element={<LenderApplications />} />
          <Route path="analytics" element={<LenderAnalytics />} />
          <Route path="subscription" element={<LenderSubscription />} />
          <Route path="profile" element={<LenderProfile />} />
        </Route>

        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="cars" element={<Browse />} />
          <Route path="cars/:id" element={<CarDetail />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="rentals/:id" element={<RentalDetail />} />
          <Route path="dealers" element={<Dealers />} />
          <Route path="dealers/:id" element={<DealerDetail />} />
          <Route path="loans" element={<Loans />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="join" element={<Join />} />
          <Route path="about" element={<About />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="report" element={<ReportAccount />} />
          <Route path="messages" element={<Messages />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
