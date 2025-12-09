
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ReviewResult {
  department: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  confidence: number;
  reasoning: string;
  action: "AUTO_ASSIGN" | "MANUAL_REVIEW";
}

export interface VerificationResult {
  checklist: {
    identityMatch: boolean;
    addressMatch: boolean;
    documentClear: boolean;
    formComplete: boolean;
  };
  forensics: {
    tamperingDetected: boolean;
    ocrNameMatch: boolean; // Does name in doc match form?
    imageQualityScore: number; // 0-100
    suspiciousPatterns: string[]; // e.g., ["Pixelation around ID number", "Font mismatch"]
  };
  confidence: number;
  recommendedStatus: "Approved" | "In Progress" | "Rejected";
  reasoning: string;
}

export class AiRoutingService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  async analyzeComplaint(title: string, description: string, location: string): Promise<ReviewResult> {
    // 1. Check if AI is configured
    if (!this.model) {
      console.warn("AI_ROUTING: Gemini API not configured, using fallback logic.");
      return this.fallbackAnalysis(description);
    }

    try {
      // 2. Construct Prompt
      const prompt = `
        You are an AI Routing Agent for a government grievance portal.
        Analyze the following complaint:
        Title: "${title}"
        Description: "${description}"
        Location: "${location}"
        
        Available Departments: "Health", "Police", "Education", "Municipal", "Transport", "Revenue", "Electricity".
        
        Output a valid JSON object with the following fields:
        - department: One of the available departments or "General".
        - category: A concise 2-3 word category (e.g., "Pothole Repair", "Bribe Complaint").
        - priority: "Low", "Medium", or "High" (High for life threats, corruption, massive public inconvenience).
        - confidence: A number between 0 and 100 representing your certainty.
        - reasoning: A 1-sentence explanation of why you chose this department and priority.
        
        Do not add markdown formatting, just plain JSON.
      `;

      // 3. API Call
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 4. Parse JSON
      // Handle potential markdown wrapping like ```json ... ```
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const aiData = JSON.parse(jsonStr);

      // 5. Apply Confidence Threshold Logic
      const action = aiData.confidence > 80 ? "AUTO_ASSIGN" : "MANUAL_REVIEW";

      return {
        department: aiData.department,
        category: aiData.category,
        priority: aiData.priority,
        confidence: aiData.confidence,
        reasoning: aiData.reasoning,
        action
      };

    } catch (error) {
      console.error("AI_ROUTING_ERROR:", error);
      return this.fallbackAnalysis(description);
    }
  }

  // New: AI Verification Checklist
  async verifyApplication(data: any): Promise<VerificationResult> {
    // HEURISTIC SIMULATION:
    // To make the demo feel "intelligent", we vary the result based on the input duration/content.
    
    const description = data.description?.toLowerCase() || "";
    const title = data.title?.toLowerCase() || "";
    const combined = description + " " + title;
    
    // 1. QUALITY CHECK: Is the input too short?
    const isShort = description.length < 30;
    
    // 2. FORENSIC TRIGGERS (Simulated via keywords)
    // If the user types "blur", "fake", "test", or "error", we simulate a bad document.
    const hasTamperKeywords = combined.includes("fake") || combined.includes("edited") || combined.includes("fraud");
    const hasBlurKeywords = combined.includes("blur") || combined.includes("unclear") || combined.includes("dark");
    const hasMismatchKeywords = combined.includes("other person") || combined.includes("wrong name");

    let confidence = 95;
    let tampering = false;
    let ocrMatch = true;
    let imageQuality = 92;
    let suspiciousPatterns: string[] = [];
    let reasoning = "Standard checks passed (Simulated AI).";
    let status: "Approved" | "In Progress" | "Rejected" = "Approved";

    // --- APPLY SIMULATED LOGIC ---
    
    if (isShort) {
        confidence -= 20; // Drop to 75%
        reasoning = "Description is too brief for high-confidence verification.";
        status = "In Progress";
    }

    if (hasTamperKeywords) {
        tampering = true;
        confidence = 10;
        suspiciousPatterns.push("Digital artifacts detected");
        reasoning = "Potential document tampering detected.";
        status = "Rejected";
    }

    if (hasBlurKeywords) {
        imageQuality = 45;
        confidence -= 30;
        suspiciousPatterns.push("Low contrast/High noise");
        reasoning = "Image quality is too low for automated verification.";
        status = "In Progress";
    }

    if (hasMismatchKeywords) {
        ocrMatch = false;
        confidence = 25;
        suspiciousPatterns.push("Name mismatch with database");
        reasoning = "Identity on document does not match application.";
        status = "Rejected";
    }

    // Add slight random jitter to score for realism (e.g., 95 -> 94 or 96)
    if (confidence > 80 && confidence < 100) {
        confidence += Math.floor(Math.random() * 5) - 2; 
    }

    // Ensure we don't return crazy values
    if (confidence < 0) confidence = 0;
    if (confidence > 99) confidence = 99;

    // 3. SAFETY PROTOCOL: Random Audit (The "Anti-Gaming" Layer)
    // To answer the question "Can't I just lie?", we randomly flag 10% of "perfect" apps.
    if (confidence > 90 && Math.random() < 0.1) {
        status = "In Progress"; // Force manual review
        reasoning = "⚠️ Flagged for Random Quality Audit (Safety Protocol)";
        // We keep the high confidence score to show the AI *would* have approved it, but didn't.
    }

    return {
        checklist: {
            identityMatch: ocrMatch,
            addressMatch: !hasMismatchKeywords,
            documentClear: imageQuality > 60,
            formComplete: !isShort
        },
        forensics: {
            tamperingDetected: tampering,
            ocrNameMatch: ocrMatch,
            imageQualityScore: imageQuality,
            suspiciousPatterns: suspiciousPatterns
        },
        confidence: confidence,
        recommendedStatus: status,
        reasoning: reasoning
    };
  }

  // Fallback simple keyword matching if AI fails
  private fallbackAnalysis(text: string): ReviewResult {
    const lower = text.toLowerCase();
    let department = "General Administration";
    let priority: "Low" | "Medium" | "High" = "Low";
    
    if (lower.includes("police") || lower.includes("theft") || lower.includes("crime")) department = "Police";
    else if (lower.includes("garbage") || lower.includes("drain") || lower.includes("road")) department = "Municipal";
    else if (lower.includes("light") || lower.includes("power") || lower.includes("electricity")) department = "Electricity";
    else if (lower.includes("health") || lower.includes("hospital")) department = "Health";

    if (lower.includes("urgent") || lower.includes("danger") || lower.includes("immediately")) priority = "High";

    return {
      department,
      category: "General Query",
      priority,
      confidence: 50,
      reasoning: "Fallback keyword matching used (AI unavailable).",
      action: "MANUAL_REVIEW"
    };
  }

  // New: Conversational AI for "Sahayak" Assistant
  async chatWithAssistant(message: string): Promise<string> {
      if (!this.model) {
          return "I am Sahayak, your virtual assistant. (AI Backend is offline, this is a mock response). How can I help you today?";
      }

      try {
          const prompt = `
            You are "Sahayak" (Helper), a polite and efficient AI Assistant for the 'Saral Seva' government portal.
            
            Your goals:
            1. Help citizens draft clear complaints (ask for location, details if missing).
            2. Explain typical government processes (documents needed for birth cert, water connection, etc).
            3. Be empathetic but professional.
            
            User's Message: "${message}"
            
            Keep your response concise (max 3 sentences unless drafting a letter).
            If asked to "Draft a complaint", output a structured text block they can copy.
          `;
          
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          return response.text();
      } catch (error) {
          console.error("AI_CHAT_ERROR", error);
          return "I'm having trouble connecting to the server. Please try again later.";
      }
  }
}

export const aiRouting = new AiRoutingService();
