﻿// server/src/routes/users.ts - ENHANCED VERSION
import express, { Request, Response } from "express";
import UserModel from "../schema/user";

const router = express.Router();

// Get user profile with better error handling
router.get("/:clerkId", async (req: Request, res: Response) => {
    try {
        const { clerkId } = req.params;

        console.log(`📥 Fetching user: ${clerkId}`);

        const user = await UserModel.findOne({ clerkId });

        if (!user) {
            console.log(`⚠️ User not found: ${clerkId}`);
            return res.status(404).json({
                error: "User not found",
                clerkId,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`✅ User found: ${clerkId} (${user.email})`);
        res.status(200).json(user);
    } catch (err) {
        console.error("❌ Error fetching user:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all users (admin only)
router.get("/", async (req: Request, res: Response) => {
    try {
        const users = await UserModel.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// NEW: Manual fallback user creation endpoint
router.post("/create-fallback", async (req: Request, res: Response) => {
    try {
        const { clerkId, email, firstName, lastName, phoneNumber, avatar, username } = req.body;

        // Validation
        if (!clerkId || !email) {
            return res.status(400).json({
                error: "clerkId and email are required"
            });
        }

        console.log(`⚠️ Fallback creation attempt for: ${clerkId}`);

        // Check if user already exists
        const existingUser = await UserModel.findOne({
            $or: [{ clerkId }, { email }]
        });

        if (existingUser) {
            console.log(`✅ User already exists: ${clerkId}`);
            return res.status(200).json({
                status: "exists",
                user: existingUser,
                message: "User already synced"
            });
        }

        // Create new user
        const newUser = new UserModel({
            clerkId,
            email: email.toLowerCase(),
            firstName: firstName || "User",
            lastName: lastName || "",
            phoneNumber,
            avatar,
            username,
            isOnboarded: false,
            lastSignInAt: new Date()
        });

        await newUser.save();

        console.log(`✅ Fallback user created: ${clerkId} (${email})`);

        return res.status(201).json({
            status: "created",
            user: newUser,
            message: "User synced successfully"
        });
    } catch (err: any) {
        console.error("❌ Fallback creation error:", err);

        // Handle duplicate key error
        if (err.code === 11000) {
            const existingUser = await UserModel.findOne({ clerkId: req.body.clerkId });
            return res.status(200).json({
                status: "exists",
                user: existingUser,
                message: "User already exists"
            });
        }

        return res.status(500).json({
            error: "Failed to create user",
            details: err.message
        });
    }
});

// Update user preferences
router.put("/:clerkId/preferences", async (req: Request, res: Response) => {
    try {
        const { preferences } = req.body;
        const user = await UserModel.findOneAndUpdate(
            { clerkId: req.params.clerkId },
            { preferences },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Mark user as onboarded
router.put("/:clerkId/onboard", async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findOneAndUpdate(
            { clerkId: req.params.clerkId },
            { isOnboarded: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Health check for user sync
router.get("/health/sync/:clerkId", async (req: Request, res: Response) => {
    try {
        const { clerkId } = req.params;
        const user = await UserModel.findOne({ clerkId });

        res.status(200).json({
            synced: !!user,
            clerkId,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;