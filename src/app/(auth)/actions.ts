"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAccount, setSessionCookie, signIn, signOut } from "@/lib/local-auth";
import { createCaptcha, verifyCaptcha, type Captcha } from "@/lib/captcha";

type AuthState = { error: string | null; message?: string | null; captcha?: Captcha };

// Every failed attempt gets a fresh challenge, because each one can be used only once.
function failure(error: string): AuthState {
  return { error, captcha: createCaptcha() };
}

export async function refreshCaptcha() {
  return createCaptcha();
}

/**
 * Where to go after signing in. Only same-site paths are allowed ("/tests", "/courses/react/…"), never
 * protocol-relative or absolute URLs, so the `next` parameter can't redirect people off-site.
 */
function getSafeDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 2048) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\r\n\t]/.test(value) || /^\/(login|signup)\b/.test(value)) {
    return "/dashboard";
  }
  return value;
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!verifyCaptcha(formData.get("captchaToken"), formData.get("captchaAnswer"))) {
    return failure("The security check answer was wrong or expired. Please try again.");
  }
  const user = await signIn(email, password);
  if (!user.ok) {
    return failure(
      user.reason === "locked"
        ? "Too many failed attempts. Please wait 15 minutes and try again."
        : "Email or password is incorrect."
    );
  }

  await setSessionCookie(user.token);
  revalidatePath("/", "layout");
  redirect(getSafeDestination(formData.get("next")));
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!verifyCaptcha(formData.get("captchaToken"), formData.get("captchaAnswer"))) {
    return failure("The security check answer was wrong or expired. Please try again.");
  }
  if (name.length < 2 || name.length > 80) {
    return failure("Enter your full name (2 to 80 characters).");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failure("Enter a valid email address.");
  }
  if (password.length < 8 || password.length > 128) {
    return failure("Password must be between 8 and 128 characters long.");
  }
  const user = await createAccount(name, email, password);
  if (!user) return failure("An account with this email already exists. Please log in.");

  await setSessionCookie(user.token);
  revalidatePath("/", "layout");
  redirect(getSafeDestination(formData.get("next")));
}

export async function logout() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
