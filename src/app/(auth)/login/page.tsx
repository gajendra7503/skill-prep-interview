import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { login } from "@/app/(auth)/actions";
import { createCaptcha } from "@/lib/captcha";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const redirectTo = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <AuthShell>
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Welcome back. Sign in to continue learning.</p>
        <AuthForm action={login} captcha={createCaptcha()} submitLabel="Sign in" redirectTo={redirectTo} />
        <p className="mt-6 text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?next=${encodeURIComponent(redirectTo)}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            Sign up
          </Link>
        </p>
    </AuthShell>
  );
}

export const dynamic = "force-dynamic";
