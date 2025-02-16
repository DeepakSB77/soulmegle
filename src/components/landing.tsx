"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Heart, Users, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
import Matching from "@/components/Matching"
import Navbar from './Navbar'

export default function SoulmagleLanding() {
  const [email, setEmail] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in (e.g., by checking localStorage or your auth state)
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    navigate('/')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const features = [
    {
      icon: Heart,
      title: "Meaningful Connections",
      description: "Find like-minded individuals through our intelligent matching system"
    },
    {
      icon: Users,
      title: "Global Community",
      description: "Connect with people from diverse backgrounds worldwide"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Your privacy and security are our top priorities"
    },
    {
      icon: Sparkles,
      title: "Smart Matching",
      description: "Our AI-powered system finds your perfect conversation partner"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-16">
        <motion.section 
          className="h-screen flex items-center justify-center"
          initial="hidden"
          animate="visible"
        >
          <motion.div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Connect Your Soul
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-6 max-w-2xl mx-auto">
              Experience meaningful conversations with people who share your interests and values
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full"
                onClick={() => navigate('/Matching')}
              >
                Start Matching
              </Button>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg rounded-full"
                onClick={() => navigate('/LearnMore')}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </motion.section>

        <motion.section 
          className="py-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ y: -5 }}
              >
                <feature.icon className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="text-center mb-16" initial="hidden" animate="visible" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-gray-600 mb-4">Get notified about new features and updates!</p>
          <form
            className="flex flex-col md:flex-row justify-center items-center gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" className="px-6 py-2">Subscribe</Button>
          </form>
        </motion.section>

        {isModalOpen && <Matching onClose={() => setIsModalOpen(false)} />}
      </main>

      <footer className="bg-white py-6 mt-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Soulmagle</h3>
              <p className="text-gray-600">Connecting souls through meaningful conversations</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/learn-more" className="text-gray-600 hover:text-blue-600">About Us</a></li>
                <li><a href="/privacy-policy" className="text-gray-600 hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-gray-600 hover:text-blue-600">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Support</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Feedback</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

