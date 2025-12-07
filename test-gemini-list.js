
import dotenv from 'dotenv';

dotenv.config();

console.log("-----------------------------------------");
console.log("Listing available Gemini Models...");

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function test() {
    try {
        console.log(`Sending request to list models...`);
        
        const response = await fetch(URL);

        if (!response.ok) {
            console.error(`HTTP ERROR: ${response.status} ${response.statusText}`);
            console.error(await response.text());
        } else {
            const data = await response.json();
            console.log("SUCCESS! Found models:");
            if (data.models) {
                data.models.forEach(m => {
                    // Start of model name
                    console.log(`- ${m.name.replace('models/', '')}`);
                    // console.log(`  Methods: ${m.supportedGenerationMethods}`);
                });
            } else {
                console.log("No models field in response:", data);
            }
        }
    } catch (error) {
        console.error("NETWORK ERROR:", error);
    }
    console.log("-----------------------------------------");
}

test();
