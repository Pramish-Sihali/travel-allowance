import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@/types/auth";
import { redirect } from "next/navigation";

// Get the session on the server side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Check if the user is authenticated
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }
  
  return session.user;
}

// Protect a route based on authentication
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/");
  }
  
  return user;
}

// Protect a route based on role
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to the default dashboard for their role
    redirect(getDashboardForRole(user.role));
  }
  
  return user;
}

// Get the dashboard URL for a specific role
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