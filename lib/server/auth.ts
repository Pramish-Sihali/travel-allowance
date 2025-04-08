// lib/server/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect(getDashboardForRole(user.role));
  }
  return user;
}

export function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case "employee":
      return "/employee/dashboard";
    case "approver":
      return "/approver/dashboard";
    case "checker":
      return "/checker/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}
