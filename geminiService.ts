
import { GoogleGenAI, Type } from "@google/genai";
import { PlanStep, ProjectFile } from "./types";

export const planningAgent = async (prompt: string, images?: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-pro";
  const systemInstruction = `You are a Senior Project Architect. Your goal is to break down complex requests into a structured technical plan.
    Provide a list of steps including dependencies. Ensure the plan covers Research, Architecture, Implementation, UI Design, and Testing.
    Output MUST be in JSON format.`;

  const imageParts = images?.map(img => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: 'image/jpeg'
    }
  })) || [];

  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        ...imageParts
      ]
    }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "title", "description", "dependencies"]
            }
          }
        },
        required: ["plan"]
      }
    }
  });

  return JSON.parse(response.text || '{"plan":[]}').plan as PlanStep[];
};

export const codingAgent = async (step: PlanStep, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-pro";
  const systemInstruction = `You are an Expert Software Engineer. Generate high-quality, production-ready code for the given task.
    Include comments and modular structure. Output multiple files if necessary.
    Output MUST be a JSON object mapping file paths to their full content.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [{ text: `Task: ${step.title}\nDescription: ${step.description}\nContext:\n${context}` }]
    }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                language: { type: Type.STRING }
              },
              required: ["name", "path", "content"]
            }
          }
        },
        required: ["files"]
      }
    }
  });

  return JSON.parse(response.text || '{"files":[]}').files as ProjectFile[];
};

export const testingAgent = async (files: ProjectFile[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";
  const systemInstruction = `You are a Quality Assurance Engineer. Review the generated files for syntax errors, logical flaws, or missing dependencies.
    Output a report including 'status' (passed/failed) and 'feedback' for each file.`;

  const fileContent = files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [{ text: `Analyze these files for bugs:\n${fileContent}` }]
    }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passed: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING },
          errors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["passed", "feedback"]
      }
    }
  });

  return JSON.parse(response.text || '{"passed":false, "feedback":"Error parsing response"}');
};

export const uiVisualAgent = async (prompt: string, plan: PlanStep[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-2.5-flash for text/SVG generation as it is more stable for code/text outputs than the image model.
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [{ text: `Generate a complete SVG code mockup or diagram for: ${prompt}. Steps involved in the process: ${plan.map(p => p.title).join(', ')}` }]
    }],
    config: {
      systemInstruction: "You are a Creative Director and Senior UI Designer. Generate a high-quality, standalone SVG code representation of a modern UI dashboard or detailed system architecture diagram. Output ONLY the raw SVG code. No markdown code blocks, no text before or after."
    }
  });

  return response.text;
};
