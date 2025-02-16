/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Video, Mic, MicOff, VideoOff, MessageSquare, X, Smile } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { io, Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from 'react-i18next'
import axios from 'axios'

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognition = typeof window.webkitSpeechRecognition;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000' // Update this with your actual backend URL

// Add these new interfaces
interface Message {
  text: string;
  sender: 'user' | 'other' | 'system';
  timestamp: string;
}

interface User {
  id: string;
  role: string;
  name: string;
}

export default function VideoChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const userVideo = useRef<HTMLVideoElement>(null)
  const partnerVideo = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [subtitles, setSubtitles] = useState<{ user: string; partner: string }>({ user: '', partner: '' })
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const { i18n } = useTranslation()
  const targetLanguage = 'en' // Change this to your desired target language code
  const [user, setUser] = useState<User | null>(null)
  const [isSkipping, setIsSkipping] = useState(false)

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socketRef.current.on('message', (message: string) => {
      setMessages(prev => [...prev, { 
        text: message, 
        sender: 'other', 
        timestamp: new Date().toISOString() 
      }]);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      console.log(isRecording);
    });

    socketRef.current.on('new_stranger', (data) => {
      console.log('New stranger connected:', data);
      if (data) {
        // Join the room
        socketRef.current?.emit('join_room', { room: data.room });
        
        // Start new video connection
        if (userVideo.current?.srcObject instanceof MediaStream) {
          const stream = userVideo.current.srcObject;
          // Initialize new peer connection with the stranger
          initializePeerConnection(stream, data.userId);
        }
      } else {
        console.log('No available strangers');
        // Optionally show a message to the user
      }
    });

    socketRef.current.on('partner_skipped', () => {
      // Clear partner video
      if (partnerVideo.current?.srcObject instanceof MediaStream) {
        partnerVideo.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setMessages(prev => [...prev, {
        text: "Your partner has left the chat",
        sender: 'system',
        timestamp: new Date().toISOString()
      }]);
    });

    socketRef.current.on('no_stranger_available', () => {
      setMessages(prev => [...prev, {
        text: "No users available at the moment. Please try again later.",
        sender: 'system',
        timestamp: new Date().toISOString()
      }]);
    });

    setSocket(socketRef.current);

    // Cleanup on component unmount
    return () => {
      socketRef.current?.close();
    };
  }, []);

  // Add scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition with improved settings
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;

        // Update local subtitles immediately
        setSubtitles(prev => ({ ...prev, user: transcript }));

        // Only translate and emit if it's a final result
        if (event.results[current].isFinal) {
          try {
            const response = await axios.post(`${BACKEND_URL}/api/translate`, {
              text: transcript,
              targetLanguage
            });
            
            if (socket) {
              socket.emit('subtitles', {
                original: transcript,
                translated: response.data.translatedText
              });
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Restart recognition on error
        recognition.stop();
        setTimeout(() => recognition.start(), 1000);
      };

      setRecognition(recognition);
    }
  }, [socket]);

  // Start recognition automatically when video is on
  useEffect(() => {
    if (isVideoOn && recognition) {
      recognition.start();
      console.log('Speech recognition started');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
        console.log('Speech recognition stopped');
      }
    };
  }, [isVideoOn, recognition]);

  // Listen for partner's subtitles
  useEffect(() => {
    if (socket) {
      socket.on('subtitles', (data: { original: string; translated: string }) => {
        setSubtitles(prev => ({
          ...prev,
          partner: i18n.language === targetLanguage ? data.translated : data.original
        }))
      })
    }
  }, [socket, i18n.language])

  // Add this useEffect for user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/user`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            role: userData.role,
            name: userData.name
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const messageData: Message = {
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    // Add message to local state
    setMessages(prev => [...prev, messageData])
    
    // Send through socket
    socket.emit('message', messageData.text)
    
    // Clear input
    setNewMessage('')
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
      console.error('Error processing audio')
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

  const stopRecordingHandler = () => {
    setIsRecording(false)
    console.log(stopRecordingHandler)
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
    
    // Redirect to the landing page
    navigate('/') // Adjust this path if your landing page is different
  }

  // Add emoji handler
  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji)
  }

  useEffect(() => {
    if (!socket) return;

    // Listen for subtitle updates
    socket.on('subtitles', (data: { text: string; sender: string }) => {
      setSubtitles(prev => ({
        ...prev,
        partner: data.sender !== user?.id ? data.text : prev.partner,
        user: data.sender === user?.id ? data.text : prev.user
      }));
    });

    return () => {
      socket.off('subtitles');
    };
  }, [socket, user?.id]);

  // Send subtitle updates when speaking
  const handleSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      // Emit subtitle through socket
      if (socket) {
        socket.emit('subtitles', {
          text: transcript,
          sender: user?.id
        });
      }
    };

    recognition.start();
    return recognition;
  }, [socket, user?.id]);

  // Start speech recognition when video is on
  useEffect(() => {
    let recognition: any;
    if (isVideoOn) {
      recognition = handleSpeechRecognition();
    }
    return () => {
      if (recognition) recognition.stop();
    };
  }, [isVideoOn, handleSpeechRecognition]);

  const handleSkip = async () => {
    setIsSkipping(true);
    
    // Stop the current video stream
    if (userVideo.current?.srcObject instanceof MediaStream) {
      userVideo.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Clear partner video
    if (partnerVideo.current?.srcObject instanceof MediaStream) {
      partnerVideo.current.srcObject.getTracks().forEach(track => track.stop());
    }

    // Clear messages
    setMessages([]);
    
    // Emit skip event to server
    if (socket) {
      socket.emit('skip');
    }

    // Wait for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find new stranger
    socket?.emit('find_stranger');
    
    setIsSkipping(false);
  };

  const initializePeerConnection = (stream: MediaStream, targetUserId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice_candidate', {
          candidate: event.candidate,
          target: targetUserId
        });
      }
    };

    // Create and send offer
    peer.createOffer()
      .then(offer => peer.setLocalDescription(offer))
      .then(() => {
        socketRef.current?.emit('offer', {
          offer: peer.localDescription,
          target: targetUserId
        });
      });

    return peer;
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
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                ref={userVideo}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                <div className="text-white text-sm">You</div>
                {subtitles.user && (
                  <div className="text-white text-sm font-light">
                    {subtitles.user}
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              className="relative bg-gray-900 rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <video
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                ref={partnerVideo}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                <div className="text-white text-sm">Stranger</div>
                {subtitles.partner && (
                  <div className="text-white text-sm font-light">
                    {subtitles.partner}
                  </div>
                )}
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
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleSkip}
              disabled={isSkipping}
            >
              {isSkipping ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              ) : (
                "Skip"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {isChatOpen && (
        <motion.div
          className="w-80 ml-4 flex flex-col h-full"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
        >
          <Card className="flex-grow flex flex-col h-full">
            <CardContent className="flex-grow flex flex-col p-4 h-full">
              <ScrollArea className="flex-grow mb-4 h-[calc(100vh-200px)]">
                <div className="space-y-4 p-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none ml-auto'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none mr-auto'
                        } max-w-[85%] break-words`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className="text-xs mt-1 opacity-70 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <form onSubmit={sendMessage} className="flex space-x-2 p-2 bg-white border-t mt-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-gray-100"
                    >
                      <Smile className="h-5 w-5 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-full p-0 border-none" 
                    side="top" 
                    align="start"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      lazyLoadEmojis={true}
                      searchPlaceholder="Search emoji..."
                    />
                  </PopoverContent>
                </Popover>
                
                <Input
                  placeholder="Type a message..."
                  className="flex-grow bg-gray-50 border-gray-200 focus:border-blue-500 rounded-full"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
                >
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

