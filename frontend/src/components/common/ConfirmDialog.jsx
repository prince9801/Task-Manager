import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Deleting...</span></>
          ) : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
