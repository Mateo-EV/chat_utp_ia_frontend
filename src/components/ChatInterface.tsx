import { useState, useRef, useEffect } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Send, Bot, User } from "lucide-react"
import { UTPLogo } from "./UTPLogo"

interface Message {
  id: string
  content: string
  type: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "¡Hola! Soy tu asistente de IA para la UTP. Puedo ayudarte con información sobre reglamentos, guías de estudiante y procedimientos académicos. ¿En qué puedo ayudarte hoy?",
      type: "assistant",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      type: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      type: "assistant",
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ pregunta: input.trim() })
        }
      )

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        )
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
        )
      )
    } catch (error) {
      console.error("Error:", error)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content:
                  "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.",
                isStreaming: false
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UTPLogo className="w-16 text-primary-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">
              UTP Chat IA
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Universidad Tecnológica del Perú • Asistente Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6 max-w-4xl mx-auto">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "assistant" && (
                  <Avatar className="h-8 w-8 bg-accent border-2 border-accent/20">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={`max-w-[80%] p-4 shadow-sm ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground border-primary/20"
                      : "bg-card text-card-foreground border-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-5 bg-muted-foreground animate-pulse ml-1" />
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.type === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </Card>

                {message.type === "user" && (
                  <Avatar className="h-8 w-8 bg-secondary border-2 border-secondary/20">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta sobre la UTP..."
                className="w-full p-3 pr-12 rounded-lg border border-border bg-background text-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none max-h-32 min-h-[48px] transition-colors"
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {input.length}/1000
              </div>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
