import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/progress";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { getAdminAccess } from "@/lib/teams";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillPrep — Learn to code, interview-ready",
  description:
    "In-depth courses on React, Angular, Next.js, JavaScript, React Native, HTML & CSS, Node.js, Express.js, Python, MySQL, and AI Prompting — each with real projects and interview-style quizzes.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  // A saved choice is rendered on the server so the page never flashes the wrong theme.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const { canAccess: showAdmin } = await getAdminAccess(user);

  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar signedIn={!!user} userName={user?.name ?? null} theme={theme} showAdmin={showAdmin} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer signedIn={!!user} />
      </body>
    </html>
  );
}
