/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Video, Mic, MicOff, VideoOff, MessageSquare, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { io, Socket } from 'socket.io-client'
import { ReactMediaRecorder } from 'react-media-recorder'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000' // Update this with your actual backend URL

export default function VideoChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [messages, setMessages] = useState<string[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const userVideo = useRef<HTMLVideoElement>(null)
  const partnerVideo = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token') // Send JWT token for authentication
      }
    })

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    socketRef.current.on('message', (message: string) => {
      setMessages(prev => [...prev, message])
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    setSocket(socketRef.current)

    // Cleanup on component unmount
    return () => {
      socketRef.current?.close()
    }
  }, [])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (socket && message.trim()) {
      socket.emit('message', message)
      setMessage('')
    }
  }

  const handleAudioUpload = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob, 'audio.wav')

    const response = await fetch(`${BACKEND_URL}/api/process_audio`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Audio processed:', data)
    } else {
      setErrorMessage('Error processing audio')
    }
  }

  const startRecording = async () => {
    setIsRecording(true)
    console.log(startRecording)
    console.log('Recording started...')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data)
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      audioChunksRef.current = [] // Clear the chunks for the next recording
      
      await handleAudioUpload(audioBlob) // Pass the Blob to the upload function
    }

    mediaRecorderRef.current.start()
  }

  const stopRecording = () => {
    setIsRecording(false)
    console.log(stopRecording)
    console.log('Recording stopped...')
    mediaRecorderRef.current?.stop() // Stop the recording
  }

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Stop video
      if (userVideo.current?.srcObject instanceof MediaStream) {
        userVideo.current.srcObject.getTracks().forEach(track => track.stop())
      }
      setIsVideoOn(false)
    } else {
      // Start video
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (userVideo.current) {
        userVideo.current.srcObject = stream
      }
      setIsVideoOn(true)
    }
  }

  const handleCancel = () => {
    // Stop the video stream
    if (userVideo.current?.srcObject instanceof MediaStream) {
      userVideo.current.srcObject.getTracks().forEach(track => track.stop())
    }
    setIsVideoOn(false)
    navigate(-1) // Navigate back to the previous page
  }

  return (
    <div className="flex h-screen bg-gray-100 p-4">
      <Card className="flex-grow flex flex-col">
        <CardContent className="flex-grow flex flex-col p-6">
          <div className="flex-grow grid grid-cols-2 gap-4">
            <motion.div
              className="relative bg-gray-900 rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <video className="w-full h-full object-cover" autoPlay muted playsInline ref={userVideo}>
                <source src="/placeholder.mp4" type="video/mp4" />
                <track kind="captions" srcLang="en" src="" label="English" default />
              </video>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                You
              </div>
            </motion.div>
            <motion.div
              className="relative bg-gray-900 rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }} 
            >
              <video className="w-full h-full object-cover" autoPlay playsInline ref={partnerVideo}>
                <source src="/placeholder.mp4" type="video/mp4" />
                <track kind="captions" srcLang="en" src="" label="English" default />
              </video>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                Stranger
              </div>
            </motion.div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Button variant={isVideoOn ? "default" : "secondary"} size="icon" onClick={toggleVideo}>
              {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant={isAudioOn ? "default" : "secondary"} size="icon" onClick={() => setIsAudioOn(!isAudioOn)}>
              {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isChatOpen ? "default" : "secondary"}
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {isChatOpen && (
        <motion.div
          className="w-80 ml-4 flex flex-col"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
        >
          <Card className="flex-grow flex flex-col">
            <CardContent className="flex-grow flex flex-col p-4">
              <ScrollArea className="flex-grow mb-4">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded-lg">
                      <p className="text-sm">{msg}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  className="flex-grow"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  ref={inputRef}
                />
                <Button type="submit">Send</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="flex-grow flex flex-col p-4">
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            <ReactMediaRecorder
              audio
              onStop={(blob) => handleAudioUpload(blob)}
              render={({ status, startRecording, stopRecording }) => (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 ${isRecording ? 'bg-red-500' : 'bg-green-500'} text-white rounded`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  <p>Status: {status}</p>
                </div>
              )}
            />
            <Button onClick={handleCancel}>Cancel</Button>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

