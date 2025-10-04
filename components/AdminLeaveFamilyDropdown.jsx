import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminLeaveFamilyDropdown({ members, onTransfer }) {
  const [selectedId, setSelectedId] = useState(members[0]?.id || '');
  const [show, setShow] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShow(true)}>
        Leave Family (Transfer Admin)
      </Button>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-2">Transfer Admin Role</h2>
            <p className="mb-4 text-gray-600">Select a member to become the new admin before you leave:</p>
            <select
              className="mb-4 px-3 py-2 border rounded w-full"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.userName || m.userEmail}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="default" onClick={async () => {
                await onTransfer(selectedId);
                setShow(false);
              }}>Confirm & Leave</Button>
              <Button size="sm" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
