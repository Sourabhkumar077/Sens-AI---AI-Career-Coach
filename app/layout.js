import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { dark } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sens-AI : A Career Coach",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="sensai-theme"
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="border-t bg-background/70 py-10">
              <div className="container mx-auto px-4 flex flex-col items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <span>© {new Date().getFullYear()}</span>
                  <span className="text-foreground font-semibold">Sens-AI </span>
                  <span>• All rights reserved.</span>
                </div>
                <div className="h-px w-24 bg-muted/70" />
                <p className="text-center text-xs md:text-sm max-w-2xl">
                  Built with 💗 by Sourabh Kumar.
                </p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
