"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Get user's previous questions to avoid repetition
  const previousAssessments = await db.assessment.findMany({
    where: { userId: user.id },
    select: { questions: true },
    orderBy: { createdAt: 'desc' },
    take: 5, // Check last 5 assessments
  });

  const previousQuestions = previousAssessments
    .flatMap(assessment => assessment.questions)
    .map(q => q.question)
    .filter(Boolean);

  const prompt = `
    Generate 25 technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    IMPORTANT: Do NOT repeat any of these previous questions:
    ${previousQuestions.join('\n')}
    
    Include a mix of difficulty levels:
    - 40% Easy (fundamental concepts, basic knowledge)
    - 40% Medium (practical application, intermediate concepts)
    - 20% Hard (advanced topics, complex scenarios, edge cases)
    
    Each question should have:
    - Clear, concise question text
    - 4 distinct answer options (A, B, C, D)
    - Correct answer marked
    - Detailed explanation of why the answer is correct
    - Difficulty level (easy, medium, hard)
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string",
          "difficulty": "easy|medium|hard",
          "category": "string (e.g., 'Core Concepts', 'Best Practices', 'Problem Solving', 'Industry Trends')"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    // Validate and enhance the quiz data
    const enhancedQuestions = quiz.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`,
      difficulty: q.difficulty || 'medium',
      category: q.category || 'Technical',
      timeEstimate: q.difficulty === 'easy' ? 30 : q.difficulty === 'medium' ? 60 : 90,
    }));

   
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function generateQuizByDifficulty(difficulty = 'medium', questionCount = 15) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate ${questionCount} ${difficulty} difficulty technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Difficulty guidelines:
    - Easy: Fundamental concepts, basic knowledge, definitions
    - Medium: Practical application, intermediate concepts, common scenarios
    - Hard: Advanced topics, complex scenarios, edge cases, optimization
    
    Each question should have:
    - Clear, concise question text
    - 4 distinct answer options (A, B, C, D)
    - Correct answer marked
    - Detailed explanation of why the answer is correct
    - Category (e.g., 'Core Concepts', 'Best Practices', 'Problem Solving', 'Industry Trends')
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string",
          "difficulty": "${difficulty}",
          "category": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    // Validate and enhance the quiz data
    const enhancedQuestions = quiz.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`,
      difficulty: q.difficulty || difficulty,
      category: q.category || 'Technical',
      timeEstimate: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 60 : 90,
    }));

    return enhancedQuestions;
  } catch (error) {
    console.error("Error generating difficulty-specific quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}