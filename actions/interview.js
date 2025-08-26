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

    return enhancedQuestions;
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

export async function saveQuizResult(questions, answers, score, timeSpent = 0) {
  try {
    console.log("saveQuizResult called with:", {
      questionsCount: questions?.length,
      answersCount: answers?.length,
      score,
      timeSpent,
      hasQuestions: !!questions,
      hasAnswers: !!answers
    });

    // Test database connection
    try {
      await db.$queryRaw`SELECT 1`;
      console.log("Database connection test successful");
    } catch (dbError) {
      console.error("Database connection test failed:", dbError);
      throw new Error("Database connection failed. Please try again.");
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    console.log("User found:", { id: user.id, industry: user.industry });

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

    console.log("Question results processed:", questionResults.length);

    // Calculate detailed analytics
    const totalQuestions = questions.length;
    const correctAnswers = questionResults.filter(q => q.isCorrect).length;
    const wrongAnswers = questionResults.filter(q => !q.isCorrect);
    
    console.log("Analytics calculated:", { totalQuestions, correctAnswers, wrongAnswersCount: wrongAnswers.length });
    
    // Difficulty breakdown
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

    console.log("Difficulty breakdown:", difficultyBreakdown);

    // Calculate scores per difficulty
    Object.keys(difficultyBreakdown).forEach(diff => {
      if (difficultyBreakdown[diff].total > 0) {
        difficultyBreakdown[diff].score = (difficultyBreakdown[diff].correct / difficultyBreakdown[diff].total) * 100;
      }
    });

    // Get wrong answers for improvement tips
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
        console.log("Improvement tip generated:", improvementTip);
      } catch (error) {
        console.error("Error generating improvement tip:", error);
        // Continue without improvement tip if generation fails
      }
    }

    console.log("About to save assessment with data:", {
      userId: user.id,
      quizScore: score,
      questionsCount: questionResults.length,
      hasImprovementTip: !!improvementTip,
      timeSpent,
      hasDifficultyBreakdown: !!difficultyBreakdown,
      totalQuestions,
      correctAnswers
    });

    // Create assessment with only the fields that definitely exist
    const assessmentData = {
      userId: user.id,
      quizScore: score,
      questions: questionResults,
      category: "Technical",
      improvementTip,
    };

    // Only add new fields if they exist and have values
    if (timeSpent !== undefined && timeSpent !== null) {
      assessmentData.timeSpent = timeSpent;
    }
    
    if (difficultyBreakdown && Object.keys(difficultyBreakdown).length > 0) {
      assessmentData.difficultyBreakdown = difficultyBreakdown;
    }
    
    if (totalQuestions !== undefined && totalQuestions !== null) {
      assessmentData.totalQuestions = totalQuestions;
    }
    
    if (correctAnswers !== undefined && correctAnswers !== null) {
      assessmentData.correctAnswers = correctAnswers;
    }

    console.log("Final assessment data:", assessmentData);

    const assessment = await db.assessment.create({
      data: assessmentData,
    });

    console.log("Assessment saved successfully:", assessment.id);
    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    
    // Try to save with minimal data if the enhanced save fails
    try {
      console.log("Attempting fallback save with minimal data...");
      const fallbackAssessment = await db.assessment.create({
        data: {
          userId: user.id,
          quizScore: score,
          questions: questions.map((q, index) => ({
            question: q.question,
            answer: q.correctAnswer,
            userAnswer: answers[index],
            isCorrect: q.correctAnswer === answers[index],
            explanation: q.explanation,
          })),
          category: "Technical",
          improvementTip: null,
        },
      });
      console.log("Fallback save successful");
      return fallbackAssessment;
    } catch (fallbackError) {
      console.error("Fallback save also failed:", fallbackError);
      throw new Error("Failed to save quiz result. Please try again.");
    }
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

    // Calculate comprehensive stats
    const totalQuizzes = assessments.length;
    const averageScore = assessments.reduce((sum, a) => sum + a.quizScore, 0) / totalQuizzes;
    const bestScore = Math.max(...assessments.map(a => a.quizScore));
    const totalQuestions = assessments.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);

    // Difficulty breakdown
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

    // Category breakdown
    const categoryBreakdown = {};
    assessments.forEach(a => {
      if (a.questions) {
        a.questions.forEach(q => {
          const category = q.category || 'Technical';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });
      }
    });

    // Improvement trend (compare last 3 vs previous 3)
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
