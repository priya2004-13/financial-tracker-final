// client/src/hooks/useClerkSync.ts - ENHANCED VERSION
import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';

interface SyncStatus {
    isSyncing: boolean;
    isSynced: boolean;
    error: string | null;
    retryCount: number;
}

const MAX_RETRIES = 8; // Increased from 5
const BASE_DELAY = 1000;
const MAX_DELAY = 30000; // Increased to 30 seconds
const WEBHOOK_TIMEOUT = 45000; // 45 seconds total timeout

export const useClerkSync = () => {
    const { user, isLoaded } = useUser();
    const [status, setStatus] = useState<SyncStatus>({
        isSyncing: false,
        isSynced: false,
        error: null,
        retryCount: 0
    });

    const retryCount = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const totalTimeoutRef = useRef<NodeJS.Timeout>();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // Calculate exponential backoff with jitter
    const getRetryDelay = (attempt: number): number => {
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
        const jitter = Math.random() * 1000;
        return delay + jitter;
    };

    // Manual user creation fallback
    const createUserManually = async () => {
        if (!user) return false;

        try {
            console.log('⚠️ Attempting manual user creation fallback...');

            const response = await fetch(`${API_BASE_URL}/users/create-fallback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    firstName: user.firstName || 'User',
                    lastName: user.lastName || '',
                    phoneNumber: user.phoneNumbers?.[0]?.phoneNumber,
                    avatar: user.imageUrl,
                    username: user.username
                })
            });

            if (response.ok) {
                console.log('✅ Manual user creation successful');
                return true;
            }

            return false;
        } catch (err) {
            console.error('❌ Manual creation failed:', err);
            return false;
        }
    };

    const checkSync = useCallback(async () => {
        if (!user?.id) return;

        try {
            setStatus(prev => ({
                ...prev,
                isSyncing: true,
                error: null,
                retryCount: retryCount.current
            }));

            const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.ok) {
                console.log('✅ User sync verified');
                setStatus({
                    isSyncing: false,
                    isSynced: true,
                    error: null,
                    retryCount: retryCount.current
                });
                retryCount.current = 0;

                // Clear timeouts
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (totalTimeoutRef.current) clearTimeout(totalTimeoutRef.current);
                return;
            }

            // User not found
            if (response.status === 404) {
                if (retryCount.current < MAX_RETRIES) {
                    const delay = getRetryDelay(retryCount.current);
                    console.log(`⏳ User not found, retry ${retryCount.current + 1}/${MAX_RETRIES} in ${delay}ms`);

                    retryCount.current++;
                    setStatus(prev => ({ ...prev, retryCount: retryCount.current }));

                    timeoutRef.current = setTimeout(() => {
                        checkSync();
                    }, delay);
                } else {
                    console.warn('⚠️ Max retries reached, attempting fallback...');

                    // Try manual creation
                    const fallbackSuccess = await createUserManually();

                    if (fallbackSuccess) {
                        // Verify creation
                        setTimeout(() => checkSync(), 2000);
                    } else {
                        setStatus({
                            isSyncing: false,
                            isSynced: false,
                            error: 'User sync failed. Please refresh the page.',
                            retryCount: retryCount.current
                        });
                    }
                }
                return;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (err) {
            console.error('❌ Sync check failed:', err);

            if (retryCount.current < MAX_RETRIES) {
                const delay = getRetryDelay(retryCount.current);
                retryCount.current++;

                timeoutRef.current = setTimeout(() => {
                    checkSync();
                }, delay);
            } else {
                setStatus({
                    isSyncing: false,
                    isSynced: false,
                    error: 'Connection error. Please check your internet and refresh.',
                    retryCount: retryCount.current
                });
            }
        }
    }, [user?.id, API_BASE_URL]);

    // Manual retry function
    const manualRetry = useCallback(() => {
        retryCount.current = 0;
        setStatus({
            isSyncing: true,
            isSynced: false,
            error: null,
            retryCount: 0
        });
        checkSync();
    }, [checkSync]);

    useEffect(() => {
        if (!isLoaded || !user?.id) return;

        console.log('🔄 Starting user sync check...');

        // Start sync check
        checkSync();

        // Set total timeout
        totalTimeoutRef.current = setTimeout(() => {
            if (!status.isSynced) {
                console.warn('⏱️ Webhook timeout reached');
                setStatus(prev => ({
                    ...prev,
                    isSyncing: false,
                    error: 'Sync timeout. Click retry to continue.'
                }));
            }
        }, WEBHOOK_TIMEOUT);

        // Cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (totalTimeoutRef.current) clearTimeout(totalTimeoutRef.current);
            retryCount.current = 0;
        };
    }, [user?.id, isLoaded, checkSync]);

    return {
        ...status,
        manualRetry
    };
};