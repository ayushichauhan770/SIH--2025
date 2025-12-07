
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("-----------------------------------------");
console.log("Testing Gemini API Key validity...");

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log("Sending test request to Gemini...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        
        console.log("SUCCESS! Gemini API Key is working.");
        console.log("Response:", text);
    } catch (error) {
        console.error("GEMINI REQUEST FAILED!");
        console.error("Error:", error);
    }
    console.log("-----------------------------------------");
}

test();
