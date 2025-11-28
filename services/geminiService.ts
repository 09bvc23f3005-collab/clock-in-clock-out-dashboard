import { GoogleGenAI, Type } from "@google/genai";
import { BotIntent, GeminiIntentResponse } from "../types";

const parseMessageIntent = async (message: string): Promise<GeminiIntentResponse> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("No API Key found");
      // Fallback for simple commands if no API key
      const lower = message.toLowerCase();
      if (lower.includes('in') || lower.includes('start')) return { intent: BotIntent.CLOCK_IN, confidence: 1 };
      if (lower.includes('out') || lower.includes('stop') || lower.includes('end')) return { intent: BotIntent.CLOCK_OUT, confidence: 1 };
      if (lower.includes('status') || lower.includes('time')) return { intent: BotIntent.STATUS, confidence: 1 };
      return { intent: BotIntent.UNKNOWN, confidence: 1 };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are a parser for a time-tracking Discord bot. Analyze the user's message to determine if they want to Clock In (start work), Clock Out (end work), or check their Status.
        
        Rules:
        - "in", "start", "morning", "login", "here" -> CLOCK_IN
        - "out", "end", "bye", "logout", "leaving" -> CLOCK_OUT
        - "how long", "hours", "stats", "time" -> STATUS
        - Calculate timeOffsetMinutes if the user mentions past time (e.g. "started 10 mins ago" -> 10).
        - Return 'confidence' between 0 and 1.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { 
              type: Type.STRING, 
              enum: [BotIntent.CLOCK_IN, BotIntent.CLOCK_OUT, BotIntent.STATUS, BotIntent.UNKNOWN] 
            },
            notes: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            timeOffsetMinutes: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiIntentResponse;
    }
    
    return { intent: BotIntent.UNKNOWN, confidence: 0 };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return { intent: BotIntent.UNKNOWN, confidence: 0 };
  }
};

export const GeminiService = {
  parseMessageIntent
};