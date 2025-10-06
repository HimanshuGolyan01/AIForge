import express, { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// -------------------- /template route -------------------
app.post("/template", async (req: Request, res: Response) => {
  try {
    const prompt = req.body.prompt;

    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content:
            "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
    });

    const answer =
      completion?.choices?.[0]?.message?.content?.trim()?.toLowerCase() ?? "";
    console.log("Answer:", answer);

    if (answer === "react") {
      return res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    if (answer === "node") {
      return res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    res.status(403).json({ message: "You can't access this" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------- /chat route --------------------
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const messages = req.body.messages;

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: getSystemPrompt() },
        ...messages,
      ],
      max_tokens: 8000,
      temperature: 0.7,
    });

    const answer =
      response?.choices?.[0]?.message?.content?.trim() ?? "";

    res.json({ response: answer });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Chat error", error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
