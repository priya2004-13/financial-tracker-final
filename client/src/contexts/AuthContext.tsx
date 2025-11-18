import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/api-utils";

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    createdAt?: string;
    preferences?: {
        theme?: 'light' | 'dark';
        currency?: string;
        language?: string;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();


    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                const storedUser = localStorage.getItem("user");
                if (storedUser) setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const register = async (formData: any) => {
        try {
            setError(null);
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Registration failed");

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        }
    };
    const googleLogin = async (credential: string) => {
        try {
            setError(null);
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credential }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Google login failed");

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/");
        } catch (err: any) {
            console.error("Google Login Error:", err);
            setError(err.message);
        }
    };
    // ✅ New Function to Update Profile
    const updateProfile = async (data: Partial<User>) => {
        if (!user?._id || !token) return;

        try {
            setError(null);
            const res = await fetch(`${API_BASE_URL}/users/${user._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Ensure you use this on backend if middleware exists
                },
                body: JSON.stringify(data),
            });

            const updatedUser = await res.json();
            if (!res.ok) throw new Error(updatedUser.error || "Update failed");

            // Update State and LocalStorage
            setUser(prev => ({ ...prev, ...updatedUser }));
            localStorage.setItem("user", JSON.stringify({ ...user, ...updatedUser }));

        } catch (err: any) {
            console.error("Profile update error:", err);
            throw err;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, updateProfile,googleLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};