import { useState, useEffect } from "react"
// import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <header className="fixed w-full z-50 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-lg">
      <nav className="container mx-auto flex justify-between items-center px-4 py-2">
        <a 
          className="text-2xl font-bold text-blue-600 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          Soulmagle
        </a>
        
        <div className="flex items-center gap-6">
          {/* <Button variant="ghost" onClick={() => navigate('/learn-more')}>
            Learn More
          </Button>
          <Button variant="ghost" onClick={() => navigate('/contact')}>
            Contact
          </Button> */}
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
} 