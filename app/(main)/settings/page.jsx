"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveUserApiKey, getUserApiKeyStatus } from "@/actions/user";
import Link from "next/link";

// Form validation schema
const apiKeySchema = z.object({
  apiKey: z.string().min(10, "API Key is required and should be valid."),
});

export default function SettingsPage() {
  const [apiKeyStatus, setApiKeyStatus] = useState({ loading: true, hasApiKey: false });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(apiKeySchema),
  });

  // Check if API key exists when the page loads
  useEffect(() => {
    async function checkStatus() {
      const status = await getUserApiKeyStatus();
      setApiKeyStatus({ loading: false, hasApiKey: status.hasApiKey });
    }
    checkStatus();
  }, []);

  const onSubmit = async (data) => {
    const toastId = toast.loading("Saving API Key...");
    try {
      const result = await saveUserApiKey(data.apiKey);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        setApiKeyStatus({ loading: false, hasApiKey: true });
        reset();
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold gradient-title mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>
            Your API key is stored securely and is only used to power the AI features for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeyStatus.loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeyStatus.hasApiKey ? (
            <div className="flex items-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-sm text-green-400">Your Gemini API Key is set up and ready to use.</p>
            </div>
          ) : (
             <div className="flex items-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <p className="text-sm text-yellow-400">Your Gemini API Key is not set. Please add it below.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Enter your API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIzaSy..."
                {...register("apiKey")}
              />
              {errors.apiKey && (
                <p className="text-sm text-red-500">{errors.apiKey.message}</p>
              )}
            </div>
            <div className="flex justify-between items-center">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Save API Key
                    </>
                  )}
                </Button>
                <Link href="/tutorial" passHref>
                    <Button variant="link">How to get an API key?</Button>
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}