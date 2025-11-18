// server/src/schema/user.ts
import mongoose from "mongoose";

interface User {
    email: string;
    password?: string; // Optional for future OAuth, required for email auth
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    username?: string;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt?: Date;
    isOnboarded: boolean;
    preferences?: {
        theme?: 'light' | 'dark';
        currency?: string;
        language?: string;
    };
}

const userSchema = new mongoose.Schema<User>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, select: false }, // Exclude password from queries by default
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phoneNumber: { type: String },
        avatar: { type: String },
        username: { type: String, unique: true, sparse: true },
        lastSignInAt: { type: Date },
        isOnboarded: { type: Boolean, default: false },
        preferences: {
            theme: { type: String, default: 'light' },
            currency: { type: String, default: 'IN' },
            language: { type: String, default: 'en' }
        }
    },
    { timestamps: true }
);

const UserModel = mongoose.model<User>("User", userSchema);
export default UserModel;