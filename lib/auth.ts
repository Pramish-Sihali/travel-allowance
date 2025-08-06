import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
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
        if (!credentials?.email || !credentials?.password) return null;
        
        // Get user from Supabase with organization info
        const { data: user, error } = await supabase
          .from('users')
          .select(`
            *,
            organizations!users_organization_id_fkey (
              id,
              name,
              slug
            )
          `)
          .eq('email', credentials.email)
          .single();
        
        if (error || !user) return null;
        
        // For now, using plaintext password comparison
        // In production, you should hash passwords
        if (user.password !== credentials.password) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organization_id,
          organizationName: user.organizations?.name,
          organizationSlug: user.organizations?.slug,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.organizationId = user.organizationId || '';
        token.organizationName = user.organizationName || '';
        token.organizationSlug = user.organizationSlug || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.organizationSlug = token.organizationSlug;
      }
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "mysecretkey12345678901234567890",
};