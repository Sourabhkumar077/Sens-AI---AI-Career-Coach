"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import dynamic from "next/dynamic";

// Lazy load chart components
const PerformanceChartComponent = dynamic(() => import("./performance-chart-component"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />
});

export default function PerformanceChart({ assessments }) {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    if (!assessments || !Array.isArray(assessments)) return [];
    
    return assessments.map((assessment) => {
      try {
        return {
          date: format(new Date(assessment.createdAt), "MMM dd"),
          score: assessment.quizScore || 0,
        };
      } catch (error) {
        console.error("Error formatting assessment date:", error);
        return {
          date: "Invalid Date",
          score: assessment.quizScore || 0,
        };
      }
    }).filter(item => item.date !== "Invalid Date");
  }, [assessments]);

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="gradient-title text-3xl md:text-4xl">
            Performance Trend
          </CardTitle>
          <CardDescription>Your quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No quiz data available yet. Take your first quiz to see your performance trend!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="gradient-title text-3xl md:text-4xl">
          Performance Trend
        </CardTitle>
        <CardDescription>Your quiz scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <PerformanceChartComponent chartData={chartData} />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Processing chart data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
