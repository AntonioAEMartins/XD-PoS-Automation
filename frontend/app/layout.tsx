import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap"
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Frontend Debug Console",
  description:
    "Trace PoS TCP payloads, inspect tables, and drive prebill/close actions."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetBrains.variable}`}>
      <body className="antialiased">
        <div className="min-h-screen grid-accent">
          <NextTopLoader
            color="hsl(var(--primary))"
            showSpinner={false}
            crawlSpeed={120}
            height={3}
          />
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
