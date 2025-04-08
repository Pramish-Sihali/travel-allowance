import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;
  const authRoutes = ["/login", "/error"];
  const protectedRoutes = ["/admin", "/approver", "/checker", "/employee"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isApproverRoute = nextUrl.pathname.startsWith("/approver");
  const isCheckerRoute = nextUrl.pathname.startsWith("/checker");
  const isEmployeeRoute = nextUrl.pathname.startsWith("/employee");

  const DEFAULT_ADMIN_REDIRECT = "/admin/dashboard";
  const DEFAULT_APPROVER_REDIRECT = "/approver/dashboard";
  const DEFAULT_CHECKER_REDIRECT = "/checker/dashboard";
  const DEFAULT_EMPLOYEE_REDIRECT = "/employee/dashboard";
  const DEFAULT_REDIRECT = "/";

  const getRedirectUrl = (role: string): string => {
    switch (role) {
      case "superadmin":
        return DEFAULT_ADMIN_REDIRECT;
      case "approver":
        return DEFAULT_APPROVER_REDIRECT;
      case "checker":
        return DEFAULT_CHECKER_REDIRECT;
      case "employee":
        return DEFAULT_EMPLOYEE_REDIRECT;
      default:
        return DEFAULT_REDIRECT;
    }
  };

  // For authentication routes (such as login or error pages)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(getRedirectUrl(user?.role), nextUrl));
    }
    // Allow request to continue for auth routes if not logged in.
    return NextResponse.next();
  }

  // For all protected routes
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (
      (user?.role === "superadmin" && !isAdminRoute) ||
      (user?.role === "approver" && !isApproverRoute) ||
      (user?.role === "checker" && !isCheckerRoute) ||
      (user?.role === "employee" && !isEmployeeRoute)
    ) {
      return NextResponse.redirect(new URL(getRedirectUrl(user?.role), nextUrl));
    }
  }

  // Always return a response (avoid returning 'undefined')
  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
