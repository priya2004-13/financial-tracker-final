import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "./AuthCard";
import { useAuth } from "../../contexts/AuthContext";
import "./AuthForms.css"; // Import separate CSS

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, error, loading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <AuthCard>
            <div className="auth-form-container">
                <h2 className="auth-title">Sign In</h2>

                {error && <div className="auth-error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-base gradient-primary btn-auth"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?
                    <Link to="/register" className="auth-link">Sign Up</Link>
                </p>
            </div>
        </AuthCard>
    );
};