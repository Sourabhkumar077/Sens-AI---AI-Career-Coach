import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function TutorialPage() {
    return (
        <div className="max-w-4xl mx-auto py-6">
            <Link href="/settings">
                <Button variant="link" className="gap-2 pl-0 mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Settings
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-4xl gradient-title">How to Get Your Gemini API Key</CardTitle>
                    <CardDescription>
                        Follow these simple steps to generate your own free Gemini API key from Google AI Studio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-8 list-decimal list-inside">
                        {/* Step 1 */}
                        <li className="space-y-2">
                            <h3 className="text-lg font-semibold">Visit Google AI Studio</h3>
                            <p className="text-muted-foreground">
                                First, open the Google AI Studio website in a new tab by clicking the link below. You'll need to sign in with your Google account.
                            </p>
                            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">Go to Google AI Studio</Button>
                            </a>
                        </li>

                        {/* Step 2 */}
                        <li className="space-y-2">
                            <h3 className="text-lg font-semibold">Get API Key</h3>
                            <p className="text-muted-foreground">
                                After signing in, click on the **"Get API key"** button. You can usually find this on the top left side of the page.
                            </p>
                            <div className="p-4 border rounded-md bg-muted/50">
                                {/* Aapko yahan par Google AI Studio ka screenshot daalna hoga */}
                                <Image
                                    src="/tutorial-step-2.png"
                                    width={800}
                                    height={400}
                                    alt="Screenshot of Google AI Studio"
                                    className="rounded-md border"
                                />
                                <p className="text-center text-muted-foreground">[Screenshot of the Google AI Studio homepage with "Get API key" highlighted]</p>
                            </div>
                        </li>

                        {/* Step 3 */}
                        <li className="space-y-2">
                            <h3 className="text-lg font-semibold">Create a New API Key</h3>
                            <p className="text-muted-foreground">
                                A new dialog box will appear. Click on the **"Create API key in new project"** button. This will instantly generate a new key for you.
                            </p>
                            <div className="p-4 border rounded-md bg-muted/50">
                                {/* Yahan par "Create API key" dialog ka screenshot daalein */}
                                <p className="text-center text-muted-foreground">[Screenshot of the API key generation dialog]</p>
                            </div>
                        </li>

                        {/* Step 4 */}
                        <li className="space-y-2">
                            <h3 className="text-lg font-semibold">Copy Your API Key</h3>
                            <p className="text-muted-foreground">
                                Your new API key will be displayed. It's a long string of random characters starting with `AIzaSy...`. Click the copy icon next to the key to copy it to your clipboard. **Keep this key safe and do not share it publicly.**
                            </p>
                            <div className="p-4 border rounded-md bg-muted/50">
                                {/* Yahan par generate hui key ka screenshot daalein */}
                                <p className="text-center text-muted-foreground">[Screenshot of the newly generated API key with the copy button highlighted]</p>
                            </div>
                        </li>

                        {/* Step 5 */}
                        <li className="space-y-2">
                            <h3 className="text-lg font-semibold">Paste the Key in Sens-AI</h3>
                            <p className="text-muted-foreground">
                                Come back to the Sens-AI settings page and paste the copied key into the input field. Click the **"Save API Key"** button, and you're all set!
                            </p>
                            <Link href="/settings">
                                <Button>Go to Settings</Button>
                            </Link>
                        </li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}