import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/landing'
import VideoChatPage from './components/chat'
import { ToastContainer } from "react-toastify";
import Profile from "@/components/Profile"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<VideoChatPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <ToastContainer />
    </Router>
  )
}

export default App