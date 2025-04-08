import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "@/lib/db";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = getUserByEmail(credentials.email);
        
        if (!user) {
          return null;
        }
        
        // In a real app, use bcrypt.compare() to check the password
        // For the mock DB, we'll do a simple comparison for now
        const passwordMatch = user.password === credentials.password;
        
        if (!passwordMatch) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/", // Use the root page as login page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "mysecretkey12345678901234567890",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };