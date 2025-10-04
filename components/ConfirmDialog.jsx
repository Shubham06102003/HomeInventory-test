import React from 'react';
import { Button } from '@/components/ui/button';

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="mb-4 text-gray-600">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="default" onClick={onConfirm}>{confirmText}</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>{cancelText}</Button>
        </div>
      </div>
    </div>
  );
}
