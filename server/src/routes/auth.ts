// server/src/routes/auth.ts
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../schema/user";
import { registerSchema, loginSchema } from "../schema/validation";
import { OAuth2Client } from "google-auth-library";
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Add this to your .env
const client = new OAuth2Client(GOOGLE_CLIENT_ID); // ✅ Google Client
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
router.post("/google", async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ error: "Invalid Google Token" });
        }

        const { email, sub: googleId, given_name, family_name, picture } = payload;

        // 2. Check if user exists
        let user = await UserModel.findOne({ email });

        if (user) {
            // Link Google ID if not already linked
            if (!user.googleId) {
                user.avatar = picture || user.avatar;
                user.firstName = given_name || user.firstName;
                user.lastName = family_name || user.lastName;
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            user = new UserModel({
                email,
                googleId,
                firstName: given_name || "User",
                lastName: family_name || "",
                avatar: picture,
                isOnboarded: false,
            });
            await user.save();
        }

        // 3. Update Last Sign In
        user.lastSignInAt = new Date();
        await user.save();

        // 4. Generate Token
        const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token: jwtToken, user });
    } catch (err: any) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ error: "Google Authentication Failed" });
    }
});

export default router;