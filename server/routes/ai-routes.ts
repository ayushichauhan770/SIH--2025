
import express from "express";
import { askAI } from "../ai-service";

const router = express.Router();

// Chatbot endpoint
router.post("/chat", async (req, res) => {
  console.log("Received chat request:", req.body);
  try {
    const { question, userContext } = req.body;


    const systemPrompt = `
You are "Accountability AI", an empathetic and intelligent assistant for a government file tracking system.

YOUR GOAL:
Help citizens understand their file status, reasons for delay, and their rights.

TONE & STYLE:
- Professional yet approachable.
- Explain technical terms simply.
- Mix Hindi + English (Hinglish) if the user asks in that style.
- Use **Bold** for important dates/statuses.

KNOWLEDGE BASE:
- **Right to Service Act**: If a file is delayed beyond 7 days without reason, mention that they have a right to appeal.
- **Escalation**: If status is "Rejected", kindly explain they can re-apply or contact the nodal officer.

CONTEXT RULES:
- Use specific dates and names from the provided context.
- If the file is "Approved", celebrate it briefly! 🎉
- If context is missing, ask the user for their Application ID.
    `.trim();

    const userMessage = `
User question: ${question}

Context from system (JSON):
${JSON.stringify(userContext, null, 2)}
    `.trim();

    const answer = await askAI({ systemPrompt, userMessage });
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error" });
  }
});

// File Summary endpoint
router.post("/file-summary", async (req, res) => {
  try {
    const { file } = req.body;

    const systemPrompt = `
You are an intelligent analyst for the "Accountability" platform.
GOAL: Provide a crystal-clear summary of this file for a citizen.

FORMAT:
- **Issue**: [1 sentence]
- **Department**: [Name]
- **Status**: [Use emojis like ⏳, ✅, ❌]
- **Time Analysis**: [X] days pending (vs [Y] allowed).
- **Next Step**: What should the user do now?

TONE: Neutral, concise, and easy to read on a mobile screen.
    `.trim();

    const userMessage = `Here is the file data as JSON:\n${JSON.stringify(
      file,
      null,
      2
    )}`;

    const summary = await askAI({ systemPrompt, userMessage });
    res.json({ summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI summary error" });
  }
});

// Delay explanation endpoint
router.post("/delay-explain", async (req, res) => {
  try {
    const { file, delayInfo } = req.body;

    const systemPrompt = `
You are "Accountability AI", explaining delays to a concerned citizen.

GOAL: Explain WHY the file is delayed and calm the user down.

STRUCTURE:
1. **The Reason**: deeply analyze the delayInfo and logs to guess the bottleneck (e.g., "High workload in Sanitation Dept").
2. **Is it Normal?**: Compare with SLA.
3. **Action Plan**: Suggest filing an appeal if delay > 15 days, otherwise suggest waiting.

TONE: Empathetic ("We understand your frustration...") but professional.
    `.trim();

    const userMessage = `
File data:
${JSON.stringify(file, null, 2)}

Computed delay info:
${JSON.stringify(delayInfo, null, 2)}
    `.trim();

    const text = await askAI({ systemPrompt, userMessage });
    res.json({ explanation: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI delay explanation error" });
  }
});

export default router;
