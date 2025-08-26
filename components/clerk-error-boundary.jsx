"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ClerkErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleError = (event) => {
      // Check if it's a Clerk-related error
      if (event.error && (
        event.error.message?.includes('clerk') ||
        event.error.message?.includes('authentication') ||
        event.error.message?.includes('auth')
      )) {
        setError(event.error);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      window.location.href = '/';
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center space-y-6 p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Authentication Error
            </h1>
            <p className="text-muted-foreground">
              We encountered an issue with your authentication. This usually resolves itself, but if it persists, you may need to sign in again.
            </p>
          </div>

          {error && (
            <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
              <p className="font-medium">Error Details:</p>
              <p>{error.message || 'Unknown error occurred'}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
