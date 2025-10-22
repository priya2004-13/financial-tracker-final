// server/src/routes/notifications.ts
import express, { Request, Response } from "express";
import NotificationModel from "../schema/notification";

const router = express.Router();

// GET all notifications for a user
router.get("/:userId", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const notifications = await NotificationModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).send(notifications);
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET unread count
router.get("/:userId/unread-count", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const count = await NotificationModel.countDocuments({
            userId: userId,
            isRead: false
        });
        res.status(200).send({ count });
    } catch (err) {
        res.status(500).send(err);
    }
});

// PUT mark notification as read
router.put("/:notificationId/read", async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const notification = await NotificationModel.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).send();
        res.status(200).send(notification);
    } catch (err) {
        res.status(500).send(err);
    }
});

// PUT mark all as read for a user
router.put("/:userId/read-all", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        await NotificationModel.updateMany(
            { userId: userId, isRead: false },
            { isRead: true }
        );
        res.status(200).send({ success: true });
    } catch (err) {
        res.status(500).send(err);
    }
});

// DELETE a notification
router.delete("/:notificationId", async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const notification = await NotificationModel.findByIdAndDelete(notificationId);
        if (!notification) return res.status(404).send();
        res.status(200).send(notification);
    } catch (err) {
        res.status(500).send(err);
    }
});

export default router;