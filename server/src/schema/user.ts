// server/src/schema/user.ts
import mongoose from "mongoose";

interface User {
    clerkId: string;               // Clerk's unique ID
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    username?: string;

    // Account metadata
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt?: Date;

    // Custom fields for your app
    isOnboarded: boolean;
    preferences?: {
        theme?: 'light' | 'dark';
        currency?: string;
        language?: string;
    };
}

const userSchema = new mongoose.Schema<User>(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
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
    {
        timestamps: true
    }
);

const UserModel = mongoose.model<User>("User", userSchema);
export default UserModel;