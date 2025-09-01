import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define the user role type based on Prisma enum values
type UserRole = "EMPLOYEE" | "MANAGER" | "APPROVER" | "CHECKER" | "FINANCE" | "HR_ADMIN" | "ADMIN" | "SUPER_ADMIN";

// A helper function to get the dashboard URL based on role
function getDashboardByRole(role: UserRole): string {
  switch (role) {
    case "EMPLOYEE":
      return "/dashboard"; // Employee dashboard
    case "MANAGER":
      return "/dashboard"; // Manager dashboard
    case "APPROVER":
      return "/dashboard"; // Approver dashboard
    case "CHECKER":
      return "/dashboard"; // Checker dashboard
    case "FINANCE":
      return "/dashboard"; // Finance dashboard
    case "HR_ADMIN":
      return "/dashboard"; // HR Admin dashboard
    case "ADMIN":
      return "/dashboard"; // Admin dashboard
    case "SUPER_ADMIN":
      return "/dashboard"; // Super Admin dashboard
    default:
      return "/";
  }
}

export async function middleware(request: NextRequest) {
  // Skip middleware for next-auth and API routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  try {
    // Get the token using the next-auth getToken function
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "mysecretkey12345678901234567890",
    });

    const { pathname } = request.nextUrl;

    // Allow access to the root (login) page
    if (pathname === "/") {
      // If already authenticated, redirect to appropriate dashboard
      if (token?.role) {
        return NextResponse.redirect(
          new URL(getDashboardByRole(token.role as UserRole), request.url)
        );
      }
      return NextResponse.next();
    }

    // If no token (not authenticated), redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based route protection
    const userRole = token.role as UserRole;

    // Allow all authenticated users to access the main dashboard
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.next();
    }

    // Admin and Super Admin have access to all routes
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    // Route specific protections
    if (pathname.startsWith("/employee") && userRole !== "EMPLOYEE" && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    if (pathname.startsWith("/approver") && userRole !== "APPROVER" && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    if (pathname.startsWith("/checker") && userRole !== "CHECKER" && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    if (pathname.startsWith("/hr") && userRole !== "HR_ADMIN" && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    if (pathname.startsWith("/finance") && userRole !== "FINANCE" && !isAdmin) {
      return NextResponse.redirect(new URL(getDashboardByRole(userRole), request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of errors, redirect to login for safety
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};