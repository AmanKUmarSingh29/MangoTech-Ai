import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "MangoTech AI — Smart Study Platform",
  description:
    "AI-powered study platform with PDF analysis, summarization, quiz generation, and Q&A.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark text-white antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
