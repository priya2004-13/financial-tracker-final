// client/src/hooks/useClerkSync.ts  
import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';

interface SyncStatus {
    isSyncing: boolean;
    isSynced: boolean;
    error: string | null;
}

const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 16000; // 16 seconds

export const useClerkSync = () => {
    const { user, isLoaded } = useUser();
    const [status, setStatus] = useState<SyncStatus>({
        isSyncing: false,
        isSynced: false,
        error: null
    });

    const retryCount = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // Calculate exponential backoff delay
    const getRetryDelay = (attempt: number): number => {
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    };

    const checkSync = useCallback(async () => {
        if (!user?.id) return;

        try {
            setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

            const response = await fetch(`${API_BASE_URL}/users/${user.id}`);

            if (response.ok) {
                setStatus({
                    isSyncing: false,
                    isSynced: true,
                    error: null
                });
                retryCount.current = 0; // Reset on success
                return;
            }

            // User not found - webhook might still be processing
            if (response.status === 404) {
                if (retryCount.current < MAX_RETRIES) {
                    const delay = getRetryDelay(retryCount.current);
                    console.log(`User not found, retrying in ${delay}ms (attempt ${retryCount.current + 1}/${MAX_RETRIES})`);

                    retryCount.current++;

                    timeoutRef.current = setTimeout(() => {
                        checkSync();
                    }, delay);
                } else {
                    setStatus({
                        isSyncing: false,
                        isSynced: false,
                        error: 'User sync timeout - please refresh the page'
                    });
                }
                return;
            }

            // Other errors
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (err) {
            console.error('Sync check failed:', err);

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
                    error: err instanceof Error ? err.message : 'Sync failed'
                });
            }
        }
    }, [user?.id, API_BASE_URL]);

    useEffect(() => {
        if (!isLoaded || !user?.id) return;

        // Start sync check
        checkSync();

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            retryCount.current = 0;
        };
    }, [user?.id, isLoaded, checkSync]);

    return status;
};