import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    // ... other user fields
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    // Load user if token exists on mount
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // You need a route like /auth/me to fetch user by token
                    // Or store user in localStorage (less secure but easier for Phase 1)
                    // For now, let's assume we decoded JWT or stored user in localstorage
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) setUser(JSON.parse(storedUser));
                } catch (err) {
                    logout();
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            const res = await fetch(`${API_URL}/auth/login`, {
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
            const res = await fetch(`${API_URL}/auth/register`, {
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

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};