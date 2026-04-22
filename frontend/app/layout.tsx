import type { Metadata } from "next/types";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500"],
  variable: "--font-fraunces",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "XD-PoS — Reverse-engineering a proprietary PoS",
    template: "%s · XD-PoS"
  },
  description:
    "A case study in reverse-engineering a proprietary restaurant PoS from the outside in: MITM capture, APK decompile, and a FastAPI agent that speaks its protocol."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
    >
      <body className="antialiased">
        <NextTopLoader
          color="rgba(255,255,255,0.9)"
          showSpinner={false}
          crawlSpeed={120}
          height={2}
        />
        <div className="aurora" aria-hidden />
        <div className="relative z-10 min-h-screen">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
