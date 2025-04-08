import "next-auth";
import { JWT } from "next-auth/jwt";

export type UserRole = "employee" | "approver" | "checker" | "admin";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}