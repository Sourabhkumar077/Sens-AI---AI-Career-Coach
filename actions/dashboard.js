"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { decrypt } from "@/lib/crypto";

// Helper function to get user and initialize the AI model with the user's key
async function getModelForUser(clerkUserId) {
  const user = await db.user.findUnique({
    where: { clerkUserId },
    select: { id: true, industry: true, skills: true, geminiApiKey: true },
  });

  if (!user) throw new Error("User not found");

  if (!user.geminiApiKey) {
    throw new Error("Please add your Gemini API Key in the settings page first.");
  }
  
  const userApiKey = decrypt(user.geminiApiKey);
  const genAI = new GoogleGenerativeAI(userApiKey);
  return { model: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }), user };
}


export const generateAIInsights = async (industry, clerkUserId) => {
  try {
    // Generate insights using the specific user's API key
    const { model } = await getModelForUser(clerkUserId);

    if (!industry || typeof industry !== 'string') {
      throw new Error("Invalid industry parameter");
    }

    const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    
    // Validate the response structure
    if (!parsed.salaryRanges || !parsed.growthRate || !parsed.demandLevel || 
        !parsed.topSkills || !parsed.marketOutlook || !parsed.keyTrends || 
        !parsed.recommendedSkills) {
      throw new Error("Invalid AI response structure");
    }

    return parsed;

  } catch (error) {
    console.error("Error generating AI insights:", error);
    if (error.message.includes('API key not valid')) {
       throw new Error("Your Gemini API Key is not valid. Please check it in settings.");
    }
    // Return fallback data if AI call fails
    return {
        salaryRanges: [],
        growthRate: 0,
        demandLevel: "Medium",
        topSkills: ["Data unavailable"],
        marketOutlook: "Neutral",
        keyTrends: ["Data unavailable"],
        recommendedSkills: ["Data unavailable"]
    };
  }
};

export async function getIndustryInsights() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required. Please sign in again.");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        industryInsight: true,
      },
    });

    if (!user) {
      throw new Error("User profile not found. Please complete onboarding first.");
    }

    if (!user.industry) {
      throw new Error("Industry not set. Please complete your profile first.");
    }

    if (!user.industryInsight) {
      // Pass the clerkUserId to generate insights with the user's key
      const insights = await generateAIInsights(user.industry, userId);

      // Check if another user already created insights for this industry
      const existingInsight = await db.industryInsight.findUnique({
        where: { industry: user.industry },
      });

      if (existingInsight) {
        // If it exists, connect the user to it instead of creating a new one
        await db.user.update({
            where: { id: user.id },
            data: { industry: existingInsight.industry }
        });
        return existingInsight;
      }

      // If it doesn't exist, create it
      const newInsight = await db.industryInsight.create({
        data: {
          industry: user.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      return newInsight;
    }

    return user.industryInsight;
  } catch (error) {
    console.error("Error getting industry insights:", error);
    throw new Error(error.message || "Failed to load industry insights");
  }
}