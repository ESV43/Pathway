
import { GoogleGenAI, Type } from "@google/genai";

/**
 * PATHWAYS ACADEMIC SERVICE
 */

export const parseSyllabus = async (text: string, userApiKey?: string) => {
  // Prioritize the user's stored key, fallback to environment variable
  const apiKey = userApiKey || process.env.API_KEY;

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