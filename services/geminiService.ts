
import { GoogleGenAI, Type } from "@google/genai";

/**
 * PATHWAYS ACADEMIC SERVICE
 */

const getAIClient = (apiKey?: string) => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
};

export const parseSyllabus = async (text: string, apiKey?: string) => {
  const ai = getAIClient(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following syllabus text into a structured JSON format with modules and topics. Syllabus Text: ${text}`,
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
                    properties: { title: { type: Type.STRING } },
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

export const generateTopicAssistance = async (topicTitle: string, courseTitle: string, apiKey?: string) => {
  const ai = getAIClient(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Topic: ${topicTitle}. Course: ${courseTitle}. Provide a 2-sentence simple explanation and 3 specific actionable study tasks.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          suggestedTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["explanation", "suggestedTasks"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateCourseRoadmap = async (courseTitle: string, topics: string[], apiKey?: string) => {
  const ai = getAIClient(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Course: ${courseTitle}. Topics: ${topics.join(', ')}. Create a logical 4-week study roadmap in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.STRING },
                focus: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["week", "focus", "tasks"]
            }
          }
        },
        required: ["weeks"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generatePipelineTasks = async (projectTitle: string, category: string, apiKey?: string) => {
  const ai = getAIClient(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Project: ${projectTitle}. Category: ${category}. Suggest 5 professional sub-tasks for a student roadmap.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["tasks"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
