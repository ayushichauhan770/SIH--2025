
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export function CitizenAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            id: 0, 
            text: "Namaste! I am Sahayak, your AI assistant. I can help you draft complaints or explain processes. How can I help today?", 
            isUser: false, 
            timestamp: new Date() 
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const chatMutation = useMutation({
        mutationFn: async (msg: string) => {
            const res = await apiRequest("POST", "/api/chat", { message: msg });
            return await res.json();
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: data.response,
                isUser: false,
                timestamp: new Date()
            }]);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Sahayak is having trouble connecting.",
                variant: "destructive"
            });
            // Remove the user message if failed? Or just show error? 
            // Better to just show error toast.
        }
    });

    const handleSend = () => {
        if (!message.trim()) return;

        const userMsg = message;
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: userMsg,
            isUser: true,
            timestamp: new Date()
        }]);
        setMessage("");
        chatMutation.mutate(userMsg);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
            {isOpen && (
                <Card className="w-[350px] shadow-2xl border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                <div>
                                    <CardTitle className="text-sm font-bold">Sahayak Assistant</CardTitle>
                                    <p className="text-[10px] opacity-80">AI-Powered Citizen Support</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[400px] flex flex-col bg-slate-50 dark:bg-slate-950">
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-3">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}
                                    >
                                        <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${msg.isUser ? 'bg-slate-200' : 'bg-blue-100'}`}>
                                            {msg.isUser ? <User className="h-4 w-4 text-slate-600" /> : <Bot className="h-4 w-4 text-blue-600" />}
                                        </div>
                                        <div className={`rounded-lg p-3 text-sm ${
                                            msg.isUser 
                                                ? 'bg-slate-800 text-white' 
                                                : 'bg-white border text-slate-700 shadow-sm'
                                        }`}>
                                            {msg.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                            <div className={`text-[10px] mt-1 ${msg.isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatMutation.isPending && (
                                    <div className="flex gap-2 max-w-[85%]">
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="bg-white border rounded-lg p-3 shadow-sm flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                            <span className="text-xs text-slate-400">Sahayak is typing...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 bg-white dark:bg-slate-900 border-t">
                        <form 
                            className="flex w-full gap-2"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input 
                                placeholder="Ask about services or draft..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex-1"
                                disabled={chatMutation.isPending}
                            />
                            <Button size="icon" type="submit" disabled={chatMutation.isPending || !message.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {!isOpen && (
                <Button 
                    className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 animate-bounce"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageSquare className="h-6 w-6 text-white" />
                </Button>
            )}
        </div>
    );
}
