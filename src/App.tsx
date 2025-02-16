import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SoulmagleLanding from './components/landing'
import LearnMore from './pages/LearnMore'
import Contact from './pages/Contact'
import VideoChatPage from './components/chat'
import { ToastContainer } from "react-toastify";
import Profile from "@/components/Profile"
import Signup from './components/signup'
import Login from './components/login'
import Matching from './components/Matching'

const App = () => {
  return (
    <Router>
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<SoulmagleLanding />} />
        <Route path="/learn-more" element={<LearnMore />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/chat" element={<VideoChatPage />} />
      </Routes>
    </Router>
  )
}

export default App