
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parseSyllabus = async (text: string) => {
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

  return JSON.parse(response.text || '{}');
};
