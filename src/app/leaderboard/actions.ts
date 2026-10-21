"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, setLeaderboardOptIn } from "@/lib/local-auth";

/** Turns the signed-in user's leaderboard visibility on or off (form field `optIn` = "1" or "0"). */
export async function setLeaderboardVisibility(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/leaderboard")}`);
  await setLeaderboardOptIn(user.id, formData.get("optIn") === "1");
  revalidatePath("/leaderboard");
}
