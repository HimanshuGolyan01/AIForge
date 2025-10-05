import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

async function getLLMData() {

    const openai = new OpenAI({
        apiKey: process.env.GEMINI_API,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
    
    const response = await openai.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
                role: "user",
                content: "What is 2 + 2 ? explain who do not know even basics of maths",
            },
        ],
    });
    
    console.log(response.choices[0].message);
}

getLLMData();