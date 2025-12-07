
import { useState, useRef, useEffect } from "react";
import { useAccountabilityChat } from "@/hooks/use-accountability-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X } from "lucide-react";

interface AccountabilityChatProps {
  context?: any;
  className?: string;
  defaultOpen?: boolean;
}

export function AccountabilityChat({ context, className = "", defaultOpen = false }: AccountabilityChatProps) {
  const { messages, ask, isLoading } = useAccountabilityChat(context);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Use a callback ref to handle scroll whenever messages change
  const scrollViewportCallbackRef = (element: HTMLDivElement | null) => {
    if (element) {
        // Find the viewport element which contains the scrolling content
        const viewport = element.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  };
  
  // Also keep a ref for direct manipulation if needed, but basic auto-scroll logic usually needs the viewport
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple timeout to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
         const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
         if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
         }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOpen]);


  const handleSend = () => {
    if (!input.trim()) return;
    ask(input);
    setInput("");
  };

  if (!isOpen) {
    return (
      <Button
        className={`fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-80 h-96 flex flex-col shadow-xl z-50 animate-in fade-in slide-in-from-bottom-5 ${className}`}>
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-primary/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Ask Accountability
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="flex flex-col gap-3 min-h-[full]">
            {messages.length === 0 && (
              <div className="text-center mt-8 text-muted-foreground px-4">
                <p className="text-sm mb-2">👋 Hi!</p>
                <p className="text-xs">
                  I'm your AI assistant. Ask me about file status, delays, or general policies.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-xs flex items-center gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t gap-2 bg-background">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="h-8 text-xs focus-visible:ring-1"
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
