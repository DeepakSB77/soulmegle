"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface UserProfile {
  username: string;
  email: string;
  interests: string[];
  // Add more fields as needed
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError("Failed to load profile")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-blue-600 hover:underline"
          >
            <ArrowLeft className="mr-2" />
            Back
          </button>

          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          {profile && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Username</h2>
                <p className="text-gray-700">{profile.username}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Email</h2>
                <p className="text-gray-700">{profile.email}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => navigate('/edit-profile')}
                className="w-full mt-6"
              >
                Edit Profile
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 