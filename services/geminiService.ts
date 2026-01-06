
import { GoogleGenAI, Type } from "@google/genai";

/**
 * PATHWAYS ACADEMIC SERVICE
 */

export const parseSyllabus = async (text: string, userApiKey?: string) => {
  // 1. Safe access to process.env (Producer Key)
  // We wrap this in a try-catch because accessing 'process' in some browser environments 
  // without a polyfill can throw a ReferenceError, causing a crash.
  let producerKey = "";
  try {
    // If process is defined (e.g. via Vite define or Webpack), use it.
    producerKey = process.env.API_KEY || "";
  } catch (e) {
    // If process is not defined, we ignore the error and default to empty string.
    console.debug("Pathways: process.env is not accessible. relying on user key.");
  }

  // 2. Logic: If user provides a key, use it. Otherwise, use the Producer key.
  const apiKey = userApiKey || producerKey;

  if (!apiKey) {
    throw new Error("No API Key available. Please configure your Gemini API Key in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following syllabus text into a structured JSON format with modules and topics. Focus on the core curriculum structure.\n\nSyllabus Text: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseTitle: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING }
                    },
                    required: ["title"]
                  }
                }
              },
              required: ["title", "topics"]
            }
          }
        },
        required: ["courseTitle", "modules"]
      }
    }
  });

  // Extract the generated text output directly using the .text property
  return JSON.parse(response.text || '{}');
};
