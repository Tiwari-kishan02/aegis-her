import { Route, Routes } from 'react-router-dom'
import GlobalFooter from './components/GlobalFooter'
import OfflineBanner from './components/OfflineBanner'
import OnboardingModal from './components/OnboardingModal'
import Admin from './pages/Admin'
import Ambulance from './pages/Ambulance'
import Cab from './pages/Cab'
import Contacts from './pages/Contacts'
import History from './pages/History'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Police from './pages/Police'

export default function App() {
  return (
    <>
      <OfflineBanner />
      <OnboardingModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/police" element={<Police />} />
        <Route path="/cab" element={<Cab />} />
        <Route path="/ambulance" element={<Ambulance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalFooter />
    </>
  )
}
