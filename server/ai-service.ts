
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get or initialize OpenAI client
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// Helper to get or initialize Gemini client
function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export async function askAI(params: {
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  const { systemPrompt, userMessage } = params;
  
  // Re-read provider from env every time, or default
  const provider = process.env.AI_PROVIDER || "openai";

  console.log(`[AI] Requesting ${provider}...`);

  try {
    if (provider === "openai") {
      const openai = getOpenAI();
      if (!openai) {
         console.error("[AI] OpenAI API Key missing");
         return "Configuration Error: OpenAI API Key is missing in .env";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    }

    if (provider === "gemini") {
      const genAI = getGemini();
      if (!genAI) {
         console.error("[AI] Gemini API Key missing");
         return "Configuration Error: Gemini API Key is missing in .env";
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent({
        contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
        ]
      });
      return result.response.text();
    }
  } catch (error: any) {
    console.error("AI Service Error:", error);
    // Be specific about quota errors
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
        return "Limit Reached: Your API quota has been exceeded. Please check your billing or switch providers.";
    }
    return "I apologize, but I am currently unable to process your request. Please try again later.";
  }

  return "AI provider not configured.";
}
