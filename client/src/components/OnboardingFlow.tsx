import React, { useState } from 'react';
import { useUserProfile } from '../contexts/userContext';
import { useAuth } from '../contexts/AuthContext';

export const OnboardingFlow: React.FC = () => {
    const { user } = useAuth();
    const { profile, markAsOnboarded, loading } = useUserProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (!profile || profile.isOnboarded) {
        return null;
    }

    const handleComplete = async () => {
        try {
            setIsSubmitting(true);
            await markAsOnboarded();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                <img
                    src={user?.avatar}
                    alt="Profile"
                    style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        marginBottom: '1rem',
                        border: '3px solid #6366f1'
                    }}
                />
                <h1>Welcome, {user?.firstName}! 👋</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Let's complete your profile setup
                </p>

                <div style={{
                    background: '#f0f9ff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    textAlign: 'left'
                }}>
                    <p>✓ Email verified: {user?.email}</p>
                    <p>✓ Profile: {user?.firstName} {user?.lastName}</p>
                </div>

                <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    {isSubmitting ? 'Setting up...' : '✓ Complete Setup'}
                </button>
            </div>
        </div>
    );
};