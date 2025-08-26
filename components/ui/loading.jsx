import React from "react";

export function LoadingSpinner({ size = "default", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingSkeleton({ className = "", lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

export function LoadingCard({ className = "" }) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
