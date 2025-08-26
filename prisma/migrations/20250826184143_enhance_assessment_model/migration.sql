-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyBreakdown" JSONB,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0;
