import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  name: z.string().min(1, "Please enter your Full Name"),
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  confirmPassword: z.string().min(1, "Confirm Password is required"),
});

export const ForgotSchema = z.object({
  email: z.string().email(),
});

