"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const questions = [
  "If you could have any superpower for a day, what would it be?",
  "What's the weirdest food combination you actually enjoy?",
  "If you were a character in a movie, which genre would it be?",
  "What's one thing you would take with you to a deserted island?",
  "If animals could talk, which one do you think would be the funniest?",
]

interface MatchingProps {
  onClose?: () => void; // Add onClose if needed
}

const MatchingPage: React.FC<MatchingProps> = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<string[]>(new Array(questions.length).fill(""))
  const [showError, setShowError] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const audioUrl = URL.createObjectURL(event.data)
          setRecordings((prev) => {
            const newRecordings = [...prev]
            newRecordings[currentQuestion] = audioUrl
            return newRecordings
          })
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setShowError(false)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const nextQuestion = () => {
    if (recordings[currentQuestion]) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setShowError(false)
      } else {
        handleFinish();
      }
    } else {
      setShowError(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
      setShowError(false)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true);
    const userId = 1; // Replace with actual user ID from your authentication logic
    const answers = recordings;

    try {
      const response = await fetch(`${BACKEND_URL}/api/store_answers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: userId, answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to store answers');
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error storing answers:', error);
    }

    setTimeout(() => {
      navigate('/chat');
    }, 5000);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center">Get Matched</h1>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </h2>
          <p className="text-lg">{questions[currentQuestion]}</p>
        </div>
        <div className="flex justify-center mb-6">
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive">
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording}>Start Recording</Button>
          )}
        </div>
        {recordings[currentQuestion] && (
          <div className="mb-6">
            <audio src={recordings[currentQuestion]} controls className="w-full" />
          </div>
        )}
        {showError && (
          <motion.div className="flex items-center text-red-500 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle className="mr-2" />
            <span>Please record an answer before moving to the next question.</span>
          </motion.div>
        )}
        <div className="flex justify-between">
          <Button onClick={prevQuestion} disabled={currentQuestion === 0}>
            Previous
          </Button>
          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleFinish} disabled={!recordings.every(recording => recording)}>
              Finish
            </Button>
          ) : (
            <Button onClick={nextQuestion} disabled={!recordings[currentQuestion]}>
              Next
            </Button>
          )}
        </div>
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="loader">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-600"></div>
              <p className="mt-2">Loading...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MatchingPage

