import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // ✅ Added
import { AuthCard } from "./AuthCard";
import { useAuth } from "../../contexts/AuthContext";
import "./AuthForms.css";

export const Register = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: ""
    });

    // ✅ Get googleLogin from context
    const { register, googleLogin, error, loading } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await register(formData);
    };

    return (
        <AuthCard>
            <div className="auth-form-container">
                <h2 className="auth-title">Create Account</h2>

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
                            console.log('Sign Up Failed');
                        }}
                        text="signup_with" // Specific text for register page
                        theme="filled_blue"
                        shape="pill"
                        width="350"
                    />
                </div>

                {/* ✅ Divider */}
                <div className="divider" style={{
                    display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)'
                }}>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                    <span style={{ padding: '0 10px', fontSize: '0.875rem' }}>OR</span>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            minLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-base gradient-primary btn-auth"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?
                    <Link to="/auth" className="auth-link">Sign In</Link>
                </p>
            </div>
        </AuthCard>
    );
};