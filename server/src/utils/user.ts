// server/src/utils/user.ts
import UserModel from "../schema/user";

export async function getUserByClerkId(clerkId: string) {
    return await UserModel.findOne({ clerkId });
}

export async function getUserByEmail(email: string) {
    return await UserModel.findOne({ email });
}

export async function updateUserPreferences(
    clerkId: string,
    preferences: any
) {
    return await UserModel.findOneAndUpdate(
        { clerkId },
        { preferences },
        { new: true }
    );
}

export async function getAllUsers() {
    return await UserModel.find().sort({ createdAt: -1 });
}