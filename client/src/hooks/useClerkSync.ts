
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

interface SyncStatus {
    isSyncing: boolean;
    isSynced: boolean;
    error: string | null;
}

export const useClerkSync = () => {
    const { user, isLoaded } = useUser();
    const [status, setStatus] = useState<SyncStatus>({
        isSyncing: false,
        isSynced: false,
        error: null
    });
    const [retryCount, setRetryCount] = useState(0);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!isLoaded || !user?.id) return;

        const checkSync = async () => {
            try {
                setStatus(prev => ({ ...prev, isSyncing: true }));

                const response = await fetch(`${API_BASE_URL}/users/${user.id}`);

                if (response.ok) {
                    setStatus({
                        isSyncing: false,
                        isSynced: true,
                        error: null
                    });
                } else if (retryCount < 10) {
                    // Retry after 1 second
                    setTimeout(() => setRetryCount(prev => prev + 1), 1000);
                } else {
                    setStatus({
                        isSyncing: false,
                        isSynced: false,
                        error: 'User sync timeout'
                    });
                }
            } catch (err) {
                if (retryCount < 10) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 1000);
                }
            }
        };

        checkSync();
    }, [user?.id, isLoaded, retryCount]);

    return status;
};