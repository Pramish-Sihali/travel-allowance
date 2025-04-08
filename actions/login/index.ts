"use server";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { LoginSchema } from "./schema";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validateState = LoginSchema.safeParse(values);
  if (!validateState) {
    return { error: "Invalid fields" };
  }
  const { email, password } = values;

  console.log(email,password)

  const exisitingUser = await getUserByEmail(email.toLowerCase());
  if (!exisitingUser || !exisitingUser.email || !exisitingUser.password) {
    return { error: "Invalid credentials" };
  }

  if (exisitingUser.password) {
    const passwordsMatch = await bcrypt.compare(
      password,
      exisitingUser.password
    );
    if (!passwordsMatch) return { error: "Invalid Credentials!" };
  }

  let DEFAULT_REDIRECT_URL = "/admin/dashboard";
  if (exisitingUser.userType === "approver") {
    DEFAULT_REDIRECT_URL = "/approver/dashboard";
  } else if (exisitingUser.userType === "checker") {
    DEFAULT_REDIRECT_URL = "/checker/dashboard";
  } else if (exisitingUser.userType === "employee") {
    DEFAULT_REDIRECT_URL = "/employee/dashboard";
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || DEFAULT_REDIRECT_URL,
    });
  } catch (error) {
    console.log("error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
};
