import { Metadata } from "next";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";

// import { getSession } from "@/lib/server/auth";
// import { getDashboardForRole } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Login - Travel Allowance System",
  description: "Sign in to the Travel Allowance System",
};

export default async function LoginPage() {
  // Check if the user is already logged in
  // const session = await getSession();
  
  // If the user is already logged in, redirect to their dashboard
  // if (session?.user) {
  //   redirect(getDashboardForRole(session.user.role));
  // }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center">
        <svg 
          className="w-16 h-16 mx-auto mb-4" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M16 16V8H8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold tracking-tight">Travel Allowance System</h1>
        <p className="text-muted-foreground mt-2">
          Manage travel requests, approvals, and expenses
        </p>
      </div>
      
      <LoginForm />
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}