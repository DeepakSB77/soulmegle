import { motion } from "framer-motion"

export default function LearnMore() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-8">About Soulmagle</h1>
          <p className="text-xl text-gray-600 mb-8">
            Soulmagle is a unique platform that connects individuals through meaningful conversations,
            using AI-powered matching to find compatible conversation partners based on shared interests and values.
          </p>
          
          {/* Add more content sections */}
        </motion.div>
      </div>
    </div>
  )
} 