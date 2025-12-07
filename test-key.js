
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

console.log("-----------------------------------------");
console.log("Testing OpenAI API Key validity...");

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is missing in .env");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
    try {
        console.log("Sending test request to OpenAI...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 5,
        });
        console.log("SUCCESS! API Key is working.");
        console.log("Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("API REQUEST FAILED!");
        console.error("Error Type:", error.constructor.name);
        console.error("Status:", error.status); // 401, 429, etc.
        console.error("Message:", error.message);
        console.error("Code:", error.code); // insufficient_quota, invalid_api_key
        
        if (error.status === 429 || error.code === 'insufficient_quota') {
            console.log("\n>>> DIAGNOSIS: You have run out of credits or have no payment method attached. OpenAI is NOT free.");
        }
        if (error.status === 401) {
            console.log("\n>>> DIAGNOSIS: Your API Key is invalid.");
        }
    }
    console.log("-----------------------------------------");
}

test();
