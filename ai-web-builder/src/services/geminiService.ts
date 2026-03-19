import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export const generateInitialWebsite = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `You are an expert web developer. Create a modern, responsive, and beautiful website based on this prompt: "${prompt}". 
        Use Tailwind CSS via CDN for styling. 
        
        CRITICAL: If the prompt implies a complex site (like e-commerce, dashboard, or multi-page site), create a "Single Page App" experience within this one HTML file. 
        Use a simple JavaScript router (listening to hash changes or button clicks) to show/hide different "pages" or sections (e.g., Home, Products, Cart, Checkout, About). 
        Ensure all navigation links work to switch between these simulated pages.
        
        Return ONLY the complete HTML code including <!DOCTYPE html>, <html>, <head> (with Tailwind CDN), and <body>. 
        Do not include any markdown formatting like \`\`\`html or \`\`\`. Just the raw HTML.` }]
      }
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });

  return response.text || "";
};

export const updateWebsite = async (currentCode: string, instruction: string, history: ChatMessage[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: `Current Website Code:
${currentCode}

Instruction: ${instruction}

Update the website code according to the instruction. Maintain the same structure and Tailwind CSS usage. 
If the user asks for new pages or sections, implement them using the same "Single Page App" simulation (show/hide sections or JS routing) used in the initial code.

Return ONLY the complete updated HTML code. 
Do not include any markdown formatting like \`\`\`html or \`\`\`. Just the raw HTML.` }]
      }
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });

  return response.text || "";
};
