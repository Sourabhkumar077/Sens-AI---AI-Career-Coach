"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  try {
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

    try {
      const parsed = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!parsed.salaryRanges || !parsed.growthRate || !parsed.demandLevel || 
          !parsed.topSkills || !parsed.marketOutlook || !parsed.keyTrends || 
          !parsed.recommendedSkills) {
        throw new Error("Invalid AI response structure");
      }

      // Ensure arrays have minimum content
      if (!Array.isArray(parsed.salaryRanges) || parsed.salaryRanges.length < 3) {
        throw new Error("Insufficient salary range data");
      }

      if (!Array.isArray(parsed.topSkills) || parsed.topSkills.length < 3) {
        throw new Error("Insufficient skills data");
      }

      return parsed;
    } catch (parseError) {
      console.error("AI response parsing failed:", parseError);
      console.error("Raw AI response:", text);
      
      // Return fallback data if AI fails
      return {
        salaryRanges: [
          { role: "Entry Level", min: 40000, max: 60000, median: 50000, location: "General" },
          { role: "Mid Level", min: 60000, max: 90000, median: 75000, location: "General" },
          { role: "Senior Level", min: 90000, max: 130000, median: 110000, location: "General" }
        ],
        growthRate: 5.0,
        demandLevel: "Medium",
        topSkills: ["Communication", "Problem Solving", "Technical Skills"],
        marketOutlook: "Neutral",
        keyTrends: ["Digital Transformation", "Remote Work", "Skill Development"],
        recommendedSkills: ["Data Analysis", "Project Management", "Leadership"]
      };
    }
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Return fallback data
    return {
      salaryRanges: [
        { role: "Entry Level", min: 40000, max: 60000, median: 50000, location: "General" },
        { role: "Mid Level", min: 60000, max: 90000, median: 75000, location: "General" },
        { role: "Senior Level", min: 90000, max: 130000, median: 110000, location: "General" }
      ],
      growthRate: 5.0,
      demandLevel: "Medium",
      topSkills: ["Communication", "Problem Solving", "Technical Skills"],
      marketOutlook: "Neutral",
      keyTrends: ["Digital Transformation", "Remote Work", "Skill Development"],
      recommendedSkills: ["Data Analysis", "Project Management", "Leadership"]
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

    // If no insights exist, generate them
    if (!user.industryInsight) {
      try {
        const insights = await generateAIInsights(user.industry);

        const industryInsight = await db.industryInsight.create({
          data: {
            industry: user.industry,
            ...insights,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return industryInsight;
      } catch (aiError) {
        console.error("Failed to generate AI insights:", aiError);
        throw new Error("Failed to generate industry insights. Please try again later.");
      }
    }

    return user.industryInsight;
  } catch (error) {
    console.error("Error getting industry insights:", error);
    throw new Error(error.message || "Failed to load industry insights");
  }
}
