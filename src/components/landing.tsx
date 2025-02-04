"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Video, Shield, Globe } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Matching from "@/components/Matching"

export default function OmegleCloneLanding() {
  const [email, setEmail] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <header className="p-4 md:p-6">
        <nav className="container mx-auto flex justify-between items-center">
          <motion.h1 className="text-2xl font-bold text-blue-600" initial="hidden" animate="visible" variants={fadeIn}>
            Soulmagle
          </motion.h1>
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex gap-4">
            <Button variant="login" className="px-6 py-2">Log In</Button>
            <Button variant="signup" className="px-6 py-2">Sign Up</Button>
          </motion.div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <motion.section className="text-center mb-16" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">Meet New People</h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">Chat randomly with strangers from around the world!</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate('/matching')}>
              Start Chatting
            </Button>
            <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate('/matching')}>
              Start Video Chat
            </Button>
          </div>
        </motion.section>

        <motion.section
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {[
            { icon: MessageSquare, title: "Text Chat", description: "Connect through instant messaging" },
            { icon: Video, title: "Video Chat", description: "Face-to-face conversations with webcam" },
            { icon: Shield, title: "Safe & Anonymous", description: "Your privacy is our top priority" },
            { icon: Globe, title: "Global Community", description: "Meet people from all over the world" },
          ].map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <feature.icon className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </motion.section>

        <motion.section className="mb-16" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <ol className="space-y-4">
            {[
              "Click 'Start Chatting' to be paired with a random stranger.",
              "Begin your conversation through text or video chat.",
              "Answer a few questions and get matched with persons who share your interests.",
              "Enjoy meeting new people and making connections across the globe!",
              "Don't be abusive to others, be friendly and enjoy the chat!",
            ].map((step, index) => (
              <li key={index} className="flex items-center">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-4">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section className="text-center mb-16" initial="hidden" animate="visible" variants={fadeIn}>
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

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2023 Soulmagle. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

