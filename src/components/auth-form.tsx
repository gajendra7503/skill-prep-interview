"use client";

import { useActionState, useState, useTransition } from "react";
import { refreshCaptcha } from "@/app/(auth)/actions";
import type { Captcha } from "@/lib/captcha";

type AuthState = { error: string | null; message?: string | null; captcha?: Captcha };
type ActionFn = (prevState: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  submitLabel,
  redirectTo = "/dashboard",
  askName = false,
  captcha: initialCaptcha,
}: {
  action: ActionFn;
  captcha: Captcha;
  submitLabel: string;
  redirectTo?: string;
  askName?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, message: null });
  const serverCaptcha = state.captcha ?? initialCaptcha;
  // A manual refresh only applies until the server hands out a newer challenge.
  const [refreshed, setRefreshed] = useState<{ replaces: Captcha; captcha: Captcha } | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const captcha = refreshed?.replaces === serverCaptcha ? refreshed.captcha : serverCaptcha;

  function handleRefresh() {
    startRefresh(async () => {
      setRefreshed({ replaces: serverCaptcha, captcha: await refreshCaptcha() });
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={redirectTo} />
      {askName && (
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            minLength={2}
            maxLength={80}
            required
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <p className="mt-1 text-xs text-slate-500">Shown on your course certificates.</p>
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={254}
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete={submitLabel === "Sign up" ? "new-password" : "current-password"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <div>
        <label htmlFor="captchaAnswer" className="mb-1 block text-sm font-medium">
          Security check
        </label>
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI */}
          <img
            src={captcha.image}
            alt="Arithmetic puzzle for the security check"
            width={180}
            height={60}
            className="rounded-lg border border-slate-300 dark:border-slate-700"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || pending}
            className="text-sm font-medium text-brand-600 underline disabled:opacity-50 dark:text-brand-400"
          >
            {refreshing ? "Loading..." : "New puzzle"}
          </button>
        </div>
        <input type="hidden" name="captchaToken" value={captcha.token} />
        <input
          key={captcha.token}
          id="captchaAnswer"
          name="captchaAnswer"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{1,2}"
          maxLength={2}
          required
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
        <p className="mt-1 text-xs text-slate-500">Enter the result of the sum shown above.</p>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-gradient btn-shine px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}
