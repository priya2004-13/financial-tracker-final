// client/src/components/UserSyncStatus.tsx - ENHANCED VERSION
import React from 'react';
import { useClerkSync } from '../hooks/useClerkSync';
import { Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const UserSyncStatus: React.FC = () => {
  const { isSyncing, isSynced, error, retryCount, manualRetry } = useClerkSync();

  // Success state
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
        fontWeight: '500',
        animation: 'fadeIn 0.3s ease-in'
      }}>
        <CheckCircle size={16} />
        <span>Account synced successfully</span>
      </div>
    );
  }

  // Loading state
  if (isSyncing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#6366f1',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Syncing your account...</span>
        </div>
        {retryCount > 0 && (
          <div style={{
            fontSize: '0.75rem',
            color: '#6366f1',
            opacity: 0.8
          }}>
            Retry attempt {retryCount} of 8
          </div>
        )}
        <div style={{
          fontSize: '0.75rem',
          color: '#6366f1',
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          This usually takes a few seconds. Please wait...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
        <button
          onClick={manualRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <RefreshCw size={14} />
          Retry Sync
        </button>
        <div style={{
          fontSize: '0.75rem',
          color: '#ef4444',
          opacity: 0.8,
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          If this persists, try signing out and back in, or contact support.
        </div>
      </div>
    );
  }

  return null;
};

// Add CSS keyframes (add to your global CSS or inline styles)
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
`;