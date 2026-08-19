import React from 'react'
import Modal from './Modal'
import Button from './Button'

/** Replaces window.confirm(), which is unstyled and untranslatable. */
export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'danger', loading = false
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-body">{message}</p>
    </Modal>
  )
}
