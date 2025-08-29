"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Yahan hum developer ki API key use karenge,
// lekin isko rate limit karna zaroori hai (future step).
// Abhi ke liye, yeh demo ke liye hai.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function improvePublicContent(content) {
  if (!content || content.trim().length < 20) {
    throw new Error("Please enter at least 20 characters to improve.");
  }
  
  if (content.length > 500) {
    throw new Error("Demo is limited to 500 characters.");
  }

  const prompt = `
    As an expert resume writer, improve the following description.
    Make it more impactful and quantifiable.
    Current content: "${content}"

    Requirements:
    1. Use action verbs.
    2. Sound professional and achievement-oriented.
    3. Keep it concise but detailed.
    4. Focus on achievements over responsibilities.
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving public content:", error);
    throw new Error("AI service is currently busy. Please try again later.");
  }
}