
import dotenv from 'dotenv';

dotenv.config();

console.log("-----------------------------------------");
console.log("Testing Gemini API via direct HTTP (fetch)...");

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function test() {
    try {
        console.log(`Sending request to ${MODEL}...`);
        
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello, are you online?" }]
                }]
            })
        });

        if (!response.ok) {
            console.error(`HTTP ERROR: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Error Details:", errorText);
        } else {
            const data = await response.json();
            console.log("SUCCESS! API responded.");
            console.log("Response text:", data.candidates?.[0]?.content?.parts?.[0]?.text || "No text found");
        }
    } catch (error) {
        console.error("NETWORK ERROR:", error);
    }
    console.log("-----------------------------------------");
}

test();
