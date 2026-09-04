import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => { onConfirm?.(); onClose?.() }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </Modal>
  )
}
