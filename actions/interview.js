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

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const { model, user } = await getModelForUser(userId);

    const previousAssessments = await db.assessment.findMany({
      where: { userId: user.id },
      select: { questions: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const previousQuestions = previousAssessments.flatMap(assessment => assessment.questions).map(q => q.question).filter(Boolean);

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    const enhancedQuestions = quiz.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`,
      difficulty: q.difficulty || 'medium',
      category: q.category || 'Technical',
      timeEstimate: q.difficulty === 'easy' ? 30 : q.difficulty === 'medium' ? 60 : 90,
    }));

    return enhancedQuestions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (error.message.includes('API key not valid')) {
       throw new Error("Your Gemini API Key is not valid. Please check it in settings.");
    }
    throw new Error("Failed to generate quiz. Your API key might be invalid or has exceeded its limit.");
  }
}

export async function generateQuizByDifficulty(difficulty = 'medium', questionCount = 15) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const { model, user } = await getModelForUser(userId);
    
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

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
    if (error.message.includes('API key not valid')) {
       throw new Error("Your Gemini API Key is not valid. Please check it in settings.");
    }
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score, timeSpent = 0) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const { model, user } = await getModelForUser(userId);

    const questionResults = questions.map((q, index) => ({
      question: q.question,
      answer: q.correctAnswer,
      userAnswer: answers[index],
      isCorrect: q.correctAnswer === answers[index],
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      category: q.category || 'Technical',
      timeEstimate: q.timeEstimate || 60,
    }));

    const totalQuestions = questions.length;
    const correctAnswers = questionResults.filter(q => q.isCorrect).length;
    const wrongAnswers = questionResults.filter(q => !q.isCorrect);
    
    const difficultyBreakdown = {
      easy: { total: 0, correct: 0, score: 0 },
      medium: { total: 0, correct: 0, score: 0 },
      hard: { total: 0, correct: 0, score: 0 }
    };

    questionResults.forEach(q => {
      const diff = q.difficulty.toLowerCase();
      if (difficultyBreakdown[diff]) {
        difficultyBreakdown[diff].total++;
        if (q.isCorrect) {
          difficultyBreakdown[diff].correct++;
        }
      }
    });

    Object.keys(difficultyBreakdown).forEach(diff => {
      if (difficultyBreakdown[diff].total > 0) {
        difficultyBreakdown[diff].score = (difficultyBreakdown[diff].correct / difficultyBreakdown[diff].total) * 100;
      }
    });

    let improvementTip = null;
    if (wrongAnswers.length > 0) {
      const wrongQuestionsText = wrongAnswers
        .map(
          (q) =>
            `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"\nDifficulty: ${q.difficulty}`
        )
        .join("\n\n");

      const improvementPrompt = `
        The user got the following ${user.industry} technical interview questions wrong:

        ${wrongQuestionsText}

        Based on these mistakes, provide a concise, specific improvement tip.
        Focus on the knowledge gaps revealed by these wrong answers.
        Keep the response under 2 sentences and make it encouraging.
        Don't explicitly mention the mistakes, instead focus on what to learn/practice.
        Consider the difficulty levels when giving advice.
      `;

      try {
        const tipResult = await model.generateContent(improvementPrompt);
        improvementTip = tipResult.response.text().trim();
      } catch (error) {
        console.error("Error generating improvement tip:", error);
      }
    }

    const assessmentData = {
      userId: user.id,
      quizScore: score,
      questions: questionResults,
      category: "Technical",
      improvementTip,
      timeSpent,
      difficultyBreakdown,
      totalQuestions,
      correctAnswers,
    };

    const assessment = await db.assessment.create({
      data: assessmentData,
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result. Please try again.");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function getAssessmentStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (assessments.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0,
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
        categoryBreakdown: {},
        improvementTrend: 0,
      };
    }

    const totalQuizzes = assessments.length;
    const averageScore = assessments.reduce((sum, a) => sum + a.quizScore, 0) / totalQuizzes;
    const bestScore = Math.max(...assessments.map(a => a.quizScore));
    const totalQuestions = assessments.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);

    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    assessments.forEach(a => {
      if (a.difficultyBreakdown) {
        Object.keys(a.difficultyBreakdown).forEach(diff => {
          if (difficultyBreakdown[diff] !== undefined) {
            difficultyBreakdown[diff] += a.difficultyBreakdown[diff]?.total || 0;
          }
        });
      }
    });

    const categoryBreakdown = {};
    assessments.forEach(a => {
      if (a.questions) {
        a.questions.forEach(q => {
          const category = q.category || 'Technical';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });
      }
    });

    let improvementTrend = 0;
    if (assessments.length >= 6) {
      const recent = assessments.slice(0, 3);
      const previous = assessments.slice(3, 6);
      const recentAvg = recent.reduce((sum, a) => sum + a.quizScore, 0) / 3;
      const previousAvg = previous.reduce((sum, a) => sum + a.quizScore, 0) / 3;
      improvementTrend = recentAvg - previousAvg;
    }

    return {
      totalQuizzes,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      totalQuestions,
      difficultyBreakdown,
      categoryBreakdown,
      improvementTrend: Math.round(improvementTrend * 10) / 10,
    };
  } catch (error) {
    console.error("Error fetching assessment stats:", error);
    throw new Error("Failed to fetch assessment stats");
  }
}