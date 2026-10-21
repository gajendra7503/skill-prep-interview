"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, updateDisplayName } from "@/lib/local-auth";

export async function saveCertificateName(courseSlug: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length >= 2 && name.length <= 80) {
    await updateDisplayName(user.id, name);
  }
  revalidatePath(`/courses/${courseSlug}/certificate`);
}
