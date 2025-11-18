// server/src/routes/auth.ts
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../schema/user";
import { registerSchema, loginSchema } from "../schema/validation";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Helper for Zod errors
const formatZodError = (error: any) => {
    return error.errors.map((e: any) => e.message).join(", ");
};

// REGISTER
router.post("/register", async (req: Request, res: Response) => {
    try {
        // 1. Validate Input with Zod
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: formatZodError(validation.error) });
        }

        const { email, password, firstName, lastName } = validation.data;

        // 2. Check if user exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Save User
        const newUser = new UserModel({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            isOnboarded: false
        });
        await newUser.save();

        // 5. Generate Token
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ token, user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: formatZodError(validation.error) });
        }

        const { email, password } = validation.data;

        // 2. Find User (Explicitly select password)
        const user = await UserModel.findOne({ email }).select("+password");
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // 4. Update Sign In Time
        user.lastSignInAt = new Date();
        await user.save();

        // 5. Generate Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        // Exclude password from response
        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.json({ token, user: userResponse });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;