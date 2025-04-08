import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { userTypes } from "./lib/constants";
import { getUserByEmail } from "./data/user";

// We'll use a request context approach instead
let requestContextUserType: string | null = null;

export const CustomPrismaAdapter = (prisma: any) => {
  return {
    ...PrismaAdapter(prisma),
    async createUser(user: any) {
      const userType = userTypes.includes(requestContextUserType!)
        ? requestContextUserType
        : "employee";
      return prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          image: user.image,
          userType,
        },
      });
    },
  };
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/login",
    error: "/error",
  },
  trustHost: true,
  events: {
    // Reset userType after user creation
    createUser: () => {
      requestContextUserType = null;
    },
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (!user?.email) return false;
      const existingUser = await getUserByEmail(user.email);

      if (account.provider === "credentials") {
        // Handle login via email/password
        if (!existingUser) return false;
        const passwordsMatch = await bcrypt.compare(
          user.password,
          existingUser.password as string
        );

        return passwordsMatch;
      }

      return true;
    },
    //@ts-ignore
    async redirect({ url, baseUrl }) {
      try {
        const urlObj = new URL(url);
        const userType = urlObj.searchParams.get("userType");

        if (userType) {
          // Store in our request context
          requestContextUserType = userType;
        }
      } catch (error) {
        // console.error("Error parsing URL:", error);
      }

      // return url.startsWith(baseUrl) ? url : baseUrl;
      return url;
    },
    //@ts-ignore
    async session({ session, token }) {
      if (token.sub && session?.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.status = token.status;
        session.user.profileVerified = token.profileVerified;
        session.user.image = token.image;
        session.user.id = token.sub;
      }

      return session;
    },

    async jwt({ token }: any) {
      if (!token.sub) return token;
      const existingUser = await getUserByEmail(token.email!);
      if (!existingUser) return token;
      token.name = existingUser.name;
      token.role = existingUser.userType;
      token.email = existingUser.email;
      token.image = existingUser.image;
      token.sub = existingUser.id.toString();

      return token;
    },
  },
  session: { strategy: "jwt" },
  ...authConfig,
  adapter: CustomPrismaAdapter(db),
} as any);
