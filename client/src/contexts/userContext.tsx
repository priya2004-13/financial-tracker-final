import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

interface UserProfile {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    username?: string;
    isOnboarded: boolean;
    preferences?: {
        theme?: 'light' | 'dark';
        currency?: string;
        language?: string;
    };
}

interface UserContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    updatePreferences: (preferences: any) => Promise<void>;
    markAsOnboarded: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoaded } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const fetchProfile = async (clerkId: string) => {
        try {
            setLoading(true);

            // First, sync the user data
            if (user) {
                console.log('🔄 Syncing user data...');
                await fetch(`${API_BASE_URL}/users/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clerkId: clerkId,
                        email: user.primaryEmailAddress?.emailAddress,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumbers?.[0]?.phoneNumber,
                        avatar: user.imageUrl,
                        username: user.username
                    })
                });
            }

            // Then fetch the profile
            const response = await fetch(`${API_BASE_URL}/users/${clerkId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            setProfile(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoaded || !user?.id) return;
        fetchProfile(user.id);
    }, [user?.id, isLoaded]);

    const refreshProfile = async () => {
        if (!user?.id) return;
        await fetchProfile(user.id);
    };

    const updatePreferences = async (preferences: any) => {
        if (!user?.id) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/users/${user.id}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences })
        });

        if (!response.ok) throw new Error('Failed to update');
        setProfile(await response.json());
    };

    const markAsOnboarded = async () => {
        if (!user?.id) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/users/${user.id}/onboard`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('Failed to onboard');
        setProfile(await response.json());
    };

    return (
        <UserContext.Provider value={{
            profile,
            loading,
            error,
            refreshProfile,
            updatePreferences,
            markAsOnboarded
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserProfile must be used within UserProvider');
    }
    return context;
};