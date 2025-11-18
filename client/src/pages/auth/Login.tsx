import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // ✅ Added
import { AuthCard } from "./AuthCard";
import { useAuth } from "../../contexts/AuthContext";
import "./AuthForms.css"; // Assuming you created this in the previous step

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, googleLogin, error, loading } = useAuth(); // ✅ Get googleLogin

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <AuthCard>
            <div className="auth-form-container">
                <h2 className="auth-title">Sign In</h2>

                {error && <div className="auth-error-banner">{error}</div>}

                {/* ✅ Google Button Section */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <GoogleLogin
                        onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                                googleLogin(credentialResponse.credential);
                            }
                        }}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        theme="filled_blue"
                        shape="pill"
                        width="350"
                    />
                </div>

                <div className="divider" style={{
                    display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)'
                }}>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                    <span style={{ padding: '0 10px', fontSize: '0.875rem' }}>OR</span>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ... existing form fields (Email/Password) ... */}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
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