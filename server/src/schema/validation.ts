// server/src/schema/validation.ts
import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: "Password is required" }),
});