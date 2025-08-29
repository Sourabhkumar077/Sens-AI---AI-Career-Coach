"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { improvePublicContent } from "@/actions/public";
import { toast } from "sonner";

export default function LiveDemo() {
  const [originalText, setOriginalText] = useState("Managed a team of 5 and worked on a new feature for our app.");
  const [improvedText, setImprovedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImprove = async () => {
    setIsLoading(true);
    setImprovedText("");
    try {
      const result = await improvePublicContent(originalText);
      setImprovedText(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter mb-4">
          See the AI in Action
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Enter a short description from your resume and watch our AI make it more professional and impactful.
        </p>

        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Original Text */}
              <div className="space-y-2 text-left">
                <label className="font-medium">Your Current Description</label>
                <Textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="e.g., Managed a team and worked on new features."
                  rows={5}
                />
              </div>

              {/* Improved Text */}
              <div className="space-y-2 text-left">
                <label className="font-medium">AI-Improved Version</label>
                <div className="border rounded-md bg-background min-h-[120px] p-3 text-sm">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                     </div>
                  ) : (
                    improvedText || <span className="text-muted-foreground">Click the button to see the result...</span>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleImprove} disabled={isLoading} size="lg" className="mt-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}