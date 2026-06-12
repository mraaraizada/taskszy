import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Send, X, MessageSquare, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import Lottie from 'lottie-react'
import chatAnimation from '../../public/e98ca1a8-1170-11ee-96f7-b79ac7625595.json'
import { motion, AnimatePresence } from 'framer-motion'

const agents = [
  { id: 'taskszy', name: 'Taskszy', avatar: '/app logo.png', color: '#5b5ff8' },
  { id: 'assistant', name: 'AI Assistant', avatar: '/app logo.png', color: '#6366f1' },
  { id: 'support', name: 'Support', avatar: '/app logo.png', color: '#8b5cf6' }
]

// Random user avatar URLs
const userAvatars = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=8'
]

const getRandomAvatar = () => {
  return userAvatars[Math.floor(Math.random() * userAvatars.length)]
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('taskszy')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Welcome to Taskszy 24/7! How can I assist you today?', agent: 'taskszy', avatar: userAvatars[1] },
    { id: 2, sender: 'user', text: 'What can you help me with?', avatar: getRandomAvatar() },
    { id: 3, sender: 'agent', text: 'I can help with tasks, teams, budgets, and analytics!', agent: 'taskszy', avatar: userAvatars[2] }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto open and close chat animation
  useEffect(() => {
    // Auto open after 2 seconds
    const openTimer = setTimeout(() => {
      setIsOpen(true)
    }, 2000)

    // Auto close after 5 seconds (3 seconds after opening)
    const closeTimer = setTimeout(() => {
      setIsOpen(false)
    }, 5000)

    // Repeat the cycle every 10 seconds
    const intervalTimer = setInterval(() => {
      setIsOpen(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    }, 10000)

    return () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
      clearInterval(intervalTimer)
    }
  }, [])

  const handleSend = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: message,
      avatar: getRandomAvatar()
    }

    setMessages([...messages, newMessage])
    setMessage('')
    setIsTyping(true)

    // Simulate agent response
    setTimeout(() => {
      const agentMessage = {
        id: messages.length + 2,
        sender: 'agent',
        text: 'I understand. Let me help you with that.',
        agent: selectedAgent,
        avatar: getRandomAvatar()
      }
      setMessages(prev => [...prev, agentMessage])
      setIsTyping(false)
    }, 1500)
  }

  const currentAgent = agents.find(a => a.id === selectedAgent)

  if (!isOpen) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white relative">
        {/* Lottie animation behind the button */}
        <div className="absolute" style={{ width: '500px', height: '500px', zIndex: 1 }}>
          <Lottie 
            animationData={chatAnimation} 
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {/* Chat button on top of animation - moved upwards */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer relative z-10 shadow-md"
          style={{
            boxShadow: '0 0 30px rgba(91, 95, 248, 0.6), 0 0 60px rgba(91, 95, 248, 0.4), 0 0 90px rgba(91, 95, 248, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginTop: '-60px'
          }}
        >
          <MessageSquare className="h-9 w-9 text-primary" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="w-full h-full flex flex-col bg-white rounded-xl origin-center"
    >
      {/* Header - Compact with Taskszy logo and close button */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/logo.png" alt="Taskszy" />
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              T
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-base text-foreground">Taskszy Chat</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close chat"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ display: 'block' }}
          >
            <path 
              d="M18 6L6 18M6 6l12 12" 
              stroke="#000000" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg) => {
          return (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 items-start',
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Show avatar for both agent and user */}
              <Avatar className="h-9 w-9 shrink-0">
                {msg.sender === 'agent' ? (
                  <>
                    <AvatarImage src={msg.avatar || userAvatars[0]} alt="Agent" />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                      A
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src={msg.avatar} alt="User" />
                    <AvatarFallback className="bg-gray-300 text-gray-700 text-xs font-medium">
                      U
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 max-w-[75%] text-sm leading-relaxed',
                  msg.sender === 'user'
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
        
        {isTyping && (
          <div className="flex gap-3 items-start">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={userAvatars[0]} alt="Agent" />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                A
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-3 items-center">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 h-11 rounded-xl border-gray-200 bg-white px-4 text-sm focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-16 h-11 rounded-xl bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="h-6 w-6 text-gray-700" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
