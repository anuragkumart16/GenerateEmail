import { GoogleGenAI } from "@google/genai";
import type { Email } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an AI assistant specialized in writing emails. 
Your task is to generate only the body of the email based on the user's instructions.
The output should be clean, semantic HTML.
- Use <p> tags for paragraphs.
- Use <b> for bold, <i> for italic, and <u> for underline when appropriate.
- Use <ul> with <li> for bulleted lists.
- Do not include a subject line like 'Subject:'.
- Do not include a formal greeting (e.g., "Dear [Name],") or a sign-off (e.g., "Sincerely,") unless specifically requested in the instructions.
- Do not include <html>, <head>, or <body> tags. The output should be ready to be injected directly into a contentEditable div.`;

export const generateEmailBody = async (instructions: string, emailDetails: Partial<Email>): Promise<string> => {
  try {
    const prompt = `
      Please generate an email body in HTML format based on the following details.

      Recipient: ${emailDetails.to || 'Not specified'}
      Subject: ${emailDetails.subject || 'Not specified'}

      Instructions:
      ---
      ${instructions}
      ---
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating email body:", error);
    return "<p>Sorry, I encountered an error while generating the email. Please check the console for details.</p>";
  }
};