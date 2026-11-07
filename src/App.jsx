import { Route, Routes } from 'react-router-dom'
import Ambulance from './pages/Ambulance'
import Cab from './pages/Cab'
import Contacts from './pages/Contacts'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Police from './pages/Police'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/police" element={<Police />} />
      <Route path="/cab" element={<Cab />} />
      <Route path="/ambulance" element={<Ambulance />} />
      <Route path="/login" element={<Login />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
