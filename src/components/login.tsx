import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("Email:", email, "Password:", password)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-sm w-full relative">
        <button 
          className="absolute top-4 left-4 cursor-pointer flex items-center" 
          onClick={() => navigate(-1)} 
          aria-label="Go back"
        >
          <ArrowLeft className="inline mr-1" /> Back
        </button>
        <h2 className="text-3xl font-bold mb-4 text-center">Log In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs mx-auto"
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="max-w-xs mx-auto"
          />
          <Button type="submit" className="px-6 py-2 mx-auto">Log In</Button>
        </form>
        <p className="mt-4 text-center">
          Not a user? <a href="/signup" className="text-blue-500">Sign up</a>
        </p>
      </div>
    </div>
  )
}

export default Login
