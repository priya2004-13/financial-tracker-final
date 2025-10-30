// server/src/routes/users.ts
// ============================================
import express, { Request, Response } from "express";
import UserModel from "../schema/user";

const router = express.Router();

// Get user profile
router.get("/:clerkId", async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findOne({ clerkId: req.params.clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
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

export default router;