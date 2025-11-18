import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../../services/api-utils';

interface UserProfile {
    _id: string;
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isOnboarded?: boolean;
    [key: string]: any;
}

export const useUserProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

 

    useEffect(() => {
        let mounted = true;
        const fetchProfile = async () => {
            if (!user?._id) {
                setProfile(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/users/${user._id}`);
                const data = await res.json();
                if (!mounted) return;
                if (res.ok) setProfile(data);
                else setProfile(null);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                if (mounted) setProfile(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProfile();

        return () => {
            mounted = false;
        };
    }, [user?._id]);

    const markAsOnboarded = async () => {
        if (!user?._id) throw new Error('No user');
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user._id}/onboard`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isOnboarded: true }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                return data;
            }
            throw new Error(data?.error || 'Failed to mark onboarded');
        } catch (err) {
            console.error('markAsOnboarded error:', err);
            throw err;
        }
    };

    return { profile, markAsOnboarded, loading } as const;
};
