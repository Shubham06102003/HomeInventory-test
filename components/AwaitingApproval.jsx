import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AwaitingApproval({ invitationId, onAccepted, onRejected }) {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/family/invitations/status?id=${invitationId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        if (data.status === 'accepted') {
          onAccepted && onAccepted();
          // Reload the page to reflect new membership
          window.location.reload();
        } else if (data.status === 'rejected') {
          setError('Your request was rejected by the admin.');
          setTimeout(() => {
            onRejected && onRejected();
          }, 1500);
        }
        // If still pending, just update status and show pending message
      } else {
        setError('Failed to fetch status.');
      }
    } catch (err) {
      setError('Failed to fetch status.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <Users className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Awaiting Approval</h2>
        <p className="text-gray-600 mb-4">Your request to join the family is pending admin approval.</p>
        {loading ? (
          <div className="mb-4">
            <span className="animate-spin inline-block mr-2">⏳</span>
            <span className="text-sm text-gray-500">Checking status...</span>
          </div>
        ) : (
          <Button variant="default" onClick={checkStatus} className="mb-4">Check Status</Button>
        )}
        {status === 'pending' && !loading && !error && (
          <p className="text-sm text-gray-500">Still awaiting admin response...</p>
        )}
        {error && (
          <div className="mt-4">
            <p className="text-red-500 font-medium mb-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
