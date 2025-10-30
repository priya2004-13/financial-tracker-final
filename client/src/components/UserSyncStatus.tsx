import React from 'react';
import { useClerkSync } from '../hooks/useClerkSync';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export const UserSyncStatus: React.FC = () => {
  const { isSyncing, isSynced, error } = useClerkSync();

  if (isSynced) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <CheckCircle size={16} />
        <span>User data synced</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#6366f1',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Syncing user data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return null;
};