"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Video, Mic, MicOff, VideoOff, MessageSquare, X } from "lucide-react"

export default function VideoChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [messages, setMessages] = useState<string[]>([])
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const newSocket = new WebSocket("ws://your-backend-url");
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const newMessage = event.data;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (inputRef.current && socket) {
      socket.send(inputRef.current.value);
      inputRef.current.value = "";
    }
  };

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
              <video className="w-full h-full object-cover" autoPlay muted playsInline>
                <source src="/placeholder.mp4" type="video/mp4" />
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
              <video className="w-full h-full object-cover" autoPlay playsInline>
                <source src="/placeholder.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                Stranger
              </div>
            </motion.div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Button variant={isVideoOn ? "default" : "secondary"} size="icon" onClick={() => setIsVideoOn(!isVideoOn)}>
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
            <Button variant="destructive" size="icon">
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
              <div className="flex space-x-2">
                <Input placeholder="Type a message..." className="flex-grow" ref={inputRef} />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

