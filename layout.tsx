import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "MangoTech AI — Smart Study Platform",
  description:
    "AI-powered study platform with PDF analysis, summarization, quiz generation, and Q&A.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark text-white antialiased flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
