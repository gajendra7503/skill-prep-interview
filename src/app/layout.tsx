import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/lib/progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillPrep — Learn to code, interview-ready",
  description:
    "In-depth courses on React, Angular, Next.js, JavaScript, React Native, and HTML & CSS — each with real projects and interview-style quizzes.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <Navbar userEmail={user?.email ?? null} />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
