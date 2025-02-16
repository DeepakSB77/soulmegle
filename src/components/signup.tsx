import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Signup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email || !password) {
      toast.error("Email and password are required.")
      return
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      toast.error("Please enter a valid email address.")
      return
    }

    try {
      // Register the user
      const registerResponse = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      })

      const registerData = await registerResponse.json()
      
      if (registerResponse.ok) {
        toast.success("Registration successful!")
        
        // Automatically log in the user
        const loginResponse = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: email, password }),
        })

        const loginData = await loginResponse.json()
        
        if (loginResponse.ok) {
          localStorage.setItem('token', loginData.access_token)
          navigate('/matching')
        }
      } else {
        setError(registerData.msg || 'Registration failed')
        toast.error(registerData.msg || 'Registration failed')
      }
    } catch (err) {
      setError('Failed to connect to server')
      toast.error('Failed to connect to server')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-sm w-full relative">
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <button 
          className="absolute top-4 left-4 cursor-pointer flex items-center" 
          onClick={() => navigate(-1)} 
          aria-label="Go back"
        >
          <ArrowLeft className="inline mr-1" /> Back
        </button>
        <h2 className="text-3xl font-bold mb-4 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs mx-auto"
            maxLength={254}
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="max-w-xs mx-auto"
          />
          {password && password.length < 8 && (
            <div className="text-red-500 text-center mb-4">
              Password must be at least 8 characters long.
            </div>
          )}
          {password && !/[A-Z]/.test(password) && (
            <div className="text-red-500 text-center mb-4">
              Password must contain at least one uppercase letter.
            </div>
          )}
          {password && !/[a-z]/.test(password) && (
            <div className="text-red-500 text-center mb-4">
              Password must contain at least one lowercase letter.
            </div>
          )}
          {password && !/[0-9]/.test(password) && (
            <div className="text-red-500 text-center mb-4">
              Password must contain at least one number.
            </div>
          )}
          {password && !/[!@#$%^&*]/.test(password) && (
            <div className="text-red-500 text-center mb-4">
              Password must contain at least one special character (e.g., !, @, #, $, %, ^, &, *).
            </div>
          )}
          <p className="mt-4 text-center text-gray-600">
            Password must be 8-16 characters long and include uppercase letters, lowercase letters, numbers, and special characters.
          </p>
          <Button type="submit" className="px-6 py-2 mx-auto">Sign Up</Button>
        </form>
        <p className="mt-4 text-center">
          Already a user? <a href="/login" className="text-blue-500">Log in</a>
        </p>
      </div>
    </div>
  )
}

export default Signup
