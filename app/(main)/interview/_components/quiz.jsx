"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Brain, Zap, Timer } from "lucide-react";
import { generateQuiz, generateQuizByDifficulty, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: generatingDifficultyQuiz,
    fn: generateDifficultyQuizFn,
    data: difficultyQuizData,
  } = useFetch(generateQuizByDifficulty);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  // Timer effect
  useEffect(() => {
    let interval;
    if (quizStarted && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, startTime]);

  useEffect(() => {
    if (quizData || difficultyQuizData) {
      const data = quizData || difficultyQuizData;
      setAnswers(new Array(data.length).fill(null));
      setQuizStarted(true);
      setStartTime(Date.now());
    }
  }, [quizData, difficultyQuizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quizData || difficultyQuizData).length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    const data = quizData || difficultyQuizData;
    if (!data) return 0;
    
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === data[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / data.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    const data = quizData || difficultyQuizData;
    
    try {
      await saveQuizResultFn(data, answers, score, timeSpent);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    setTimeSpent(0);
    setQuizStarted(false);
    setStartTime(null);
    setResultData(null);
  };

  const startQuiz = (difficulty = 'all') => {
    setSelectedDifficulty(difficulty);
    if (difficulty === 'all') {
      generateQuizFn();
    } else {
      generateDifficultyQuizFn(difficulty, 15);
    }
  };

  const getCurrentData = () => quizData || difficultyQuizData;

  if (generatingQuiz || generatingDifficultyQuiz) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Generating Quiz...</CardTitle>
        </CardHeader>
        <CardContent>
          <BarLoader className="mt-4" width={"100%"} color="gray" />
          <p className="text-muted-foreground mt-2">
            Creating personalized questions for your skill level...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!getCurrentData()) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle className="text-2xl">Choose Your Quiz Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => startQuiz('all')}>
              <CardHeader className="text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <CardTitle className="text-lg">Mixed Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  25 questions with varying difficulty levels
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Easy</Badge>
                  <Badge variant="outline" className="text-xs">Medium</Badge>
                  <Badge variant="outline" className="text-xs">Hard</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => startQuiz('easy')}>
              <CardHeader className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <CardTitle className="text-lg">Beginner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  15 fundamental questions to build confidence
                </p>
                <Badge variant="outline" className="text-xs mx-auto block w-fit">Easy</Badge>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => startQuiz('hard')}>
              <CardHeader className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <CardTitle className="text-lg">Advanced</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  15 challenging questions for experts
                </p>
                <Badge variant="outline" className="text-xs mx-auto block w-fit">Hard</Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Questions are tailored to your industry and skills</p>
            <p>No repeated questions from previous quizzes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = getCurrentData();
  const question = data[currentQuestion];
  const progress = ((currentQuestion + 1) / data.length) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

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

  return (
    <Card className="mx-2">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Question {currentQuestion + 1} of {data.length}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {answeredCount}/{data.length} answered</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
              {question.difficulty || 'Medium'}
            </Badge>
            {question.category && (
              <Badge variant="outline">
                {question.category}
              </Badge>
            )}
            <Badge variant="outline">
              Est. {question.timeEstimate || 60}s
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-lg font-medium leading-relaxed">{question.question}</p>
        
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-3"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-6 p-4 bg-muted rounded-lg border-l-4 border-primary">
            <p className="font-medium text-primary mb-2">Explanation:</p>
            <p className="text-muted-foreground leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          {!showExplanation && (
            <Button
              onClick={() => setShowExplanation(true)}
              variant="outline"
              disabled={!answers[currentQuestion]}
            >
              Show Explanation
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult ? (
            <BarLoader className="mr-2" width={20} color="white" />
          ) : null}
          {currentQuestion < data.length - 1 ? "Next Question" : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
