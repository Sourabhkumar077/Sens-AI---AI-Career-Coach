"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { encrypt, decrypt } from "@/lib/crypto";

export async function updateUser(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required. Please sign in again.");
    }

    // Validate required data
    if (!data.industry || !data.experience || !data.bio || !data.skills) {
      throw new Error("All fields are required: industry, experience, bio, and skills.");
    }

    // Validate experience range
    if (data.experience < 0 || data.experience > 50) {
      throw new Error("Experience must be between 0 and 50 years.");
    }

    // Validate skills format
    if (typeof data.skills === 'string') {
      data.skills = data.skills.split(',').map(skill => skill.trim()).filter(Boolean);
    }
    
    if (!Array.isArray(data.skills) || data.skills.length === 0) {
      throw new Error("At least one skill is required.");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User profile not found. Please try signing in again.");
    }

    try {
      // Start a transaction to handle both operations
      const result = await db.$transaction(
        async (tx) => {
          // First check if industry exists
          let industryInsight = await tx.industryInsight.findUnique({
            where: {
              industry: data.industry,
            },
          });

          // If industry doesn't exist, create it with default values
          if (!industryInsight) {
            const insights = await generateAIInsights(data.industry);

            industryInsight = await tx.industryInsight.create({
              data: {
                industry: data.industry,
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          }

          // Now update the user
          const updatedUser = await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              industry: data.industry,
              experience: data.experience,
              bio: data.bio,
              skills: data.skills,
            },
          });

          return { updatedUser, industryInsight };
        },
        {
          timeout: 10000, // default: 5000
        }
      );

      revalidatePath("/");
      revalidatePath("/dashboard");
      return { success: true, user: result.updatedUser, industryInsight: result.industryInsight };
    } catch (error) {
      console.error("Transaction error:", error);
      throw new Error("Failed to update profile. Please try again.");
    }
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // Return default state instead of throwing
    return {
      isOnboarded: false,
    };
  }
}

export async function saveUserApiKey(apiKey) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  
  if (!apiKey.startsWith("AIzaSy")) {
    throw new Error("Invalid Gemini API Key format.");
  }

  const encryptedKey = encrypt(apiKey);

  try {
    await db.user.update({
      where: { clerkUserId: userId },
      data: { geminiApiKey: encryptedKey },
    });

    revalidatePath("/settings"); // Settings page ko refresh karega
    return { success: true, message: "API Key saved successfully!" };
  } catch (error) {
    console.error("Failed to save API Key:", error);
    throw new Error("Could not save the API Key. Please try again.");
  }
}

export async function getUserApiKeyStatus() {
  const { userId } = await auth();
  if (!userId) return { hasApiKey: false };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { geminiApiKey: true },
  });

  return { hasApiKey: !!user?.geminiApiKey };
}