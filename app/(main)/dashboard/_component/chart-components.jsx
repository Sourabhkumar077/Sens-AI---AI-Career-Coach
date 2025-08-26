"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ChartComponents({ salaryData }) {
  if (!salaryData || salaryData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No salary data available
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={salaryData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg p-2 shadow-md">
                    <p className="font-medium">{label}</p>
                    {payload.map((item) => (
                      <p key={item.name} className="text-sm">
                        {item.name}: ${item.value}K
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
          <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
          <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
