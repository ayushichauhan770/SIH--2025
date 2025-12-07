
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ChatMessage {
  from: "user" | "ai";
  text: string;
}

export function useAccountabilityChat(initialContext?: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ai/chat", {
        question,
        userContext: initialContext,
      });
      return res;
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { from: "ai", text: data.answer }]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Sorry, I encountered an error while connecting to the server." },
      ]);
    },
  });

  const ask = (question: string) => {
    setMessages((prev) => [...prev, { from: "user", text: question }]);
    chatMutation.mutate(question);
  };

  return {
    messages,
    ask,
    isLoading: chatMutation.isPending,
  };
}
