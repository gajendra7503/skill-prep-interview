"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/local-auth";
import { assignmentTitle } from "@/lib/teams";
import { Prisma } from "@/generated/prisma/client";

/** Every admin mutation re-checks the role on the server; the UI hiding buttons is not the safeguard. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin?error=" + encodeURIComponent("Only admins can make changes."));
  return user;
}

function back(path: string, kind: "notice" | "error", message: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name");
  const description = text(formData, "description");
  if (name.length < 2 || name.length > 80) back("/admin", "error", "Team name must be 2–80 characters.");
  if (description.length > 255) back("/admin", "error", "Description must be 255 characters or fewer.");
  let teamId: number;
  try {
    teamId = (await prisma.team.create({ data: { name, description: description || null } })).id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      back("/admin", "error", `A team called "${name}" already exists.`);
    }
    throw error;
  }
  back(`/admin/teams/${teamId}`, "notice", `Team "${name}" created. Add members and assignments below.`);
}

export async function deleteTeam(teamId: number) {
  await requireAdmin();
  const team = await prisma.team.delete({ where: { id: teamId } }).catch(() => null);
  back("/admin", "notice", team ? `Team "${team.name}" deleted.` : "That team no longer exists.");
}

export async function addMember(teamId: number, formData: FormData) {
  await requireAdmin();
  const path = `/admin/teams/${teamId}`;
  const email = text(formData, "email").toLowerCase();
  const role = text(formData, "role") === "manager" ? "manager" : "member";
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) back(path, "error", `No account uses ${email || "that email"}. Ask them to sign up first.`);
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: { role },
    create: { teamId, userId: user.id, role },
  });
  back(path, "notice", `${user.name ?? email} added as ${role}.`);
}

export async function removeMember(teamId: number, userId: string) {
  await requireAdmin();
  await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  back(`/admin/teams/${teamId}`, "notice", "Member removed.");
}

export async function setMemberRole(teamId: number, userId: string, role: string) {
  await requireAdmin();
  await prisma.teamMember.updateMany({ where: { teamId, userId }, data: { role: role === "manager" ? "manager" : "member" } });
  back(`/admin/teams/${teamId}`, "notice", role === "manager" ? "Member is now a manager." : "Manager is now a member.");
}

export async function addAssignment(teamId: number, formData: FormData) {
  await requireAdmin();
  const path = `/admin/teams/${teamId}`;
  // The select sends "course:react" or "path:frontend-developer".
  const [kind, slug] = text(formData, "target").split(":");
  if ((kind !== "course" && kind !== "path") || !slug || !assignmentTitle(kind, slug)) {
    back(path, "error", "Choose a course or learning path to assign.");
  }
  const due = text(formData, "dueDate");
  let dueDate: Date | null = null;
  if (due) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T00:00:00Z`))) back(path, "error", "Enter a valid due date.");
    dueDate = new Date(`${due}T00:00:00Z`);
  }
  await prisma.assignment.upsert({
    where: { teamId_kind_targetSlug: { teamId, kind, targetSlug: slug } },
    update: { dueDate },
    create: { teamId, kind, targetSlug: slug, dueDate },
  });
  back(path, "notice", `Assigned ${assignmentTitle(kind, slug)}${due ? `, due ${due}` : ""}.`);
}

export async function removeAssignment(teamId: number, assignmentId: number) {
  await requireAdmin();
  await prisma.assignment.deleteMany({ where: { id: assignmentId, teamId } });
  back(`/admin/teams/${teamId}`, "notice", "Assignment removed.");
}
