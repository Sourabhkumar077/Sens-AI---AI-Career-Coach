import { Brain, Target, Trophy, Clock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatsCards({ assessments }) {
  const getAverageScore = () => {
    if (!assessments?.length) return 0;
    const total = assessments.reduce(
      (sum, assessment) => sum + assessment.quizScore,
      0
    );
    return (total / assessments.length).toFixed(1);
  };

  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
    return assessments[0];
  };

  const getTotalQuestions = () => {
    if (!assessments?.length) return 0;
    return assessments.reduce(
      (sum, assessment) => sum + (assessment.totalQuestions || assessment.questions.length),
      0
    );
  };

  const getTotalTimeSpent = () => {
    if (!assessments?.length) return 0;
    return assessments.reduce(
      (sum, assessment) => sum + (assessment.timeSpent || 0),
      0
    );
  };

  const getDifficultyBreakdown = () => {
    if (!assessments?.length) return { easy: 0, medium: 0, hard: 0 };
    
    const breakdown = { easy: 0, medium: 0, hard: 0 };
    assessments.forEach(assessment => {
      if (assessment.difficultyBreakdown) {
        Object.keys(assessment.difficultyBreakdown).forEach(diff => {
          if (breakdown[diff] !== undefined) {
            breakdown[diff] += assessment.difficultyBreakdown[diff]?.total || 0;
          }
        });
      }
    });
    return breakdown;
  };

  const getImprovementTrend = () => {
    if (assessments?.length < 2) return 0;
    
    const recent = assessments[0]?.quizScore || 0;
    const previous = assessments[1]?.quizScore || 0;
    return recent - previous;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Target;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const difficultyBreakdown = getDifficultyBreakdown();
  const improvementTrend = getImprovementTrend();
  const TrendIcon = getTrendIcon(improvementTrend);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getAverageScore()}%</div>
          <p className="text-xs text-muted-foreground">
            Across {assessments?.length || 0} assessments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Questions Practiced
          </CardTitle>
          <Brain className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTotalQuestions()}</div>
          <p className="text-xs text-muted-foreground">Total questions</p>
          <div className="flex gap-1 mt-2">
            {difficultyBreakdown.easy > 0 && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                {difficultyBreakdown.easy} Easy
              </Badge>
            )}
            {difficultyBreakdown.medium > 0 && (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                {difficultyBreakdown.medium} Med
              </Badge>
            )}
            {difficultyBreakdown.hard > 0 && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                {difficultyBreakdown.hard} Hard
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getLatestAssessment()?.quizScore.toFixed(1) || 0}%
          </div>
          <p className="text-xs text-muted-foreground">Most recent quiz</p>
          {getLatestAssessment()?.timeSpent && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(getLatestAssessment().timeSpent)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Improvement Trend</CardTitle>
          <TrendIcon className={`h-4 w-4 ${getTrendColor(improvementTrend)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getTrendColor(improvementTrend)}`}>
            {improvementTrend > 0 ? '+' : ''}{improvementTrend.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {improvementTrend > 0 ? 'Improving' : improvementTrend < 0 ? 'Needs focus' : 'Stable'}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(getTotalTimeSpent())} total
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
