"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Lazy load heavy chart components with proper fallbacks
const ChartComponents = dynamic(() => import("./chart-components"), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded" />
});

const DashboardView = ({ insights }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("DashboardView received insights:", insights);
    console.log("Insights type:", typeof insights);
    console.log("Insights keys:", insights ? Object.keys(insights) : "null");
  }, [insights]);

  // Memoize expensive data transformations
  const salaryData = useMemo(() => {
    if (!insights?.salaryRanges) {
      console.log("No salary ranges found in insights");
      return [];
    }
    console.log("Processing salary ranges:", insights.salaryRanges);
    return insights.salaryRanges.map((range) => ({
      name: range.role,
      min: range.min / 1000,
      max: range.max / 1000,
      median: range.median / 1000,
    }));
  }, [insights?.salaryRanges]);

  const getDemandLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (level) => {
    switch (level?.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights?.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights?.marketOutlook).color;

  // Memoize formatted dates
  const { lastUpdatedDate, nextUpdateDistance } = useMemo(() => {
    if (!insights?.lastUpdated || !insights?.nextUpdate) {
      console.log("Missing date data:", { lastUpdated: insights?.lastUpdated, nextUpdate: insights?.nextUpdate });
      return { lastUpdatedDate: "N/A", nextUpdateDistance: "N/A" };
    }
    
    try {
      const lastUpdated = format(new Date(insights.lastUpdated), "dd/MM/yyyy");
      const nextUpdate = formatDistanceToNow(
        new Date(insights.nextUpdate),
        { addSuffix: true }
      );
      return { lastUpdatedDate: lastUpdated, nextUpdateDistance: nextUpdate };
    } catch (error) {
      console.error("Date formatting error:", error);
      return { lastUpdatedDate: "N/A", nextUpdateDistance: "N/A" };
    }
  }, [insights?.lastUpdated, insights?.nextUpdate]);

  // Safety check for insights
  if (!insights) {
    console.log("No insights data provided to DashboardView");
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Loading industry insights...
          </h2>
        </div>
      </div>
    );
  }

  console.log("Rendering dashboard with salary data:", salaryData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.marketOutlook || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.growthRate ? `${insights.growthRate.toFixed(1)}%` : "N/A"}
            </div>
            <Progress value={insights.growthRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.demandLevel || "N/A"}</div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                insights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.topSkills?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              )) || <span className="text-muted-foreground">No skills data</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClient && salaryData.length > 0 ? (
            <ChartComponents salaryData={salaryData} />
          ) : (
            <div className="h-[400px] bg-muted animate-pulse rounded flex items-center justify-center">
              <span className="text-muted-foreground">
                {salaryData.length === 0 ? "No salary data available" : "Loading chart..."}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {insights.keyTrends?.map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              )) || <li className="text-muted-foreground">No trends data available</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.recommendedSkills?.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              )) || <span className="text-muted-foreground">No skills data available</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
