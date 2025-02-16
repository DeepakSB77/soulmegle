import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function Contact() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input type="text" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input type="email" placeholder="Your email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea placeholder="Your message" className="h-32" />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
} 