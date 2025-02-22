import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './index.css'
import OmegleCloneLanding from './components/landing'
import Matching from './components/Matching'
import Chat from './components/chat'
import Signup from './components/signup'
import Login from './components/login'
import Profile from './components/Profile'
import './i18n'  // Import i18n configuration

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OmegleCloneLanding />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/matching" element={<Matching onClose={() => {/* handle close logic */}} />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
