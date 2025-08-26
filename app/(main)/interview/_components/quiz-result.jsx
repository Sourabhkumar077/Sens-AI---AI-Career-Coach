"use client";

import { Trophy, CheckCircle2, XCircle, Clock, Target, TrendingUp, TrendingDown, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return Brain;
      case 'medium': return Target;
      case 'hard': return Zap;
      default: return Target;
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 80) return TrendingUp;
    if (score >= 60) return Target;
    return TrendingDown;
  };

  return (
    <div className="mx-auto space-y-6">
      <h1 className="flex items-center gap-2 text-3xl gradient-title">
        <Trophy className="h-6 w-6 text-yellow-500" />
        Quiz Results
      </h1>

      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-4xl font-bold">{result.quizScore.toFixed(1)}%</h3>
            <Progress value={result.quizScore} className="w-full h-3" />
            <p className="text-sm text-muted-foreground">
              {result.correctAnswers || 0} out of {result.totalQuestions || result.questions.length} questions correct
            </p>
          </div>

          {/* Time and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="font-semibold">{formatTime(result.timeSpent || 0)}</p>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="font-semibold">{result.totalQuestions || result.questions.length}</p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="font-semibold">{result.correctAnswers || 0}</p>
            </div>
            <div className="text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-muted-foreground">Incorrect</p>
              <p className="font-semibold">{(result.totalQuestions || result.questions.length) - (result.correctAnswers || 0)}</p>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        {result.difficultyBreakdown && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Performance by Difficulty</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(result.difficultyBreakdown).map(([difficulty, stats]) => {
                if (stats.total === 0) return null;
                const Icon = getDifficultyIcon(difficulty);
                const score = stats.score || 0;
                const PerformanceIcon = getPerformanceIcon(score);
                
                return (
                  <div key={difficulty} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium capitalize">{difficulty}</span>
                      <Badge className={getDifficultyColor(difficulty)}>
                        {stats.total} questions
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <span className={`font-semibold ${getPerformanceColor(score)}`}>
                          {score.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PerformanceIcon className="h-3 w-3" />
                        <span>{stats.correct}/{stats.total} correct</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Improvement Tip */}
        {result.improvementTip && (
          <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
            <p className="font-medium text-primary mb-2">💡 Improvement Tip</p>
            <p className="text-muted-foreground leading-relaxed">{result.improvementTip}</p>
          </div>
        )}

        {/* Questions Review */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Question Review</h3>
          <div className="space-y-3">
            {result.questions.map((q, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                      {q.difficulty && (
                        <Badge className={getDifficultyColor(q.difficulty)} variant="outline">
                          {q.difficulty}
                        </Badge>
                      )}
                      {q.category && (
                        <Badge variant="outline" className="text-xs">
                          {q.category}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium leading-relaxed">{q.question}</p>
                  </div>
                  {q.isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Your answer:</p>
                    <p className={`font-medium ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {q.userAnswer}
                    </p>
                  </div>
                  {!q.isCorrect && (
                    <div>
                      <p className="text-muted-foreground">Correct answer:</p>
                      <p className="font-medium text-green-600">{q.answer}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-muted p-3 rounded border-l-2 border-primary">
                  <p className="font-medium text-primary mb-1">Explanation:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {!hideStartNew && (
        <CardFooter>
          <Button onClick={onStartNew} className="w-full">
            Start New Quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
