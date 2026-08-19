import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import Button from '../ui/Button'
import { formatFileSize } from '../../lib/status'

/**
 * The media route sits behind authRequired, so a plain <a href> sent no
 * Authorization header and always failed — 401 locally, 404 anywhere
 * else because the host was hardcoded to localhost:5000. Fetching as a
 * blob through the axios instance carries the token and honours
 * VITE_API_URL.
 */
export default function AppointmentAttachments({ attachments }) {
  const { t } = useTranslation()
  const [urls, setUrls] = useState({})
  const [loadingKey, setLoadingKey] = useState(null)
  const [errored, setErrored] = useState({})
  const createdRef = useRef([])

  useEffect(() => () => {
    createdRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  const open = async (attachment) => {
    if (urls[attachment.filename]) return
    setLoadingKey(attachment.filename)
    try {
      const response = await api.get(`/appointments/media/${attachment.filename}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: attachment.mimeType }))
      createdRef.current.push(url)
      setUrls(prev => ({ ...prev, [attachment.filename]: url }))
    } catch (err) {
      console.error('Attachment load failed:', err)
      setErrored(prev => ({ ...prev, [attachment.filename]: true }))
    } finally {
      setLoadingKey(null)
    }
  }

  if (!attachments?.length) return null

  return (
    <div className="mb-4">
      <h4 className="text-caption font-semibold text-muted uppercase tracking-wide mb-2">
        {t('appointments.patientAttachments')}
      </h4>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {attachments.map((attachment, i) => {
          const isVideo = attachment.mimeType?.startsWith('video')
          const url = urls[attachment.filename]
          return (
            <li key={attachment.filename || i} className="p-3 bg-surface-2 rounded-control">
              <div className="flex items-start gap-2.5 mb-2">
                <span className="shrink-0 w-8 h-8 rounded-control bg-surface border border-line text-muted flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    {isVideo
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.5-2.25v8.5L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3" />}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium text-ink truncate">
                    {attachment.fileName || attachment.filename}
                  </p>
                  <p className="text-caption text-muted tabular">{formatFileSize(attachment.fileSize)}</p>
                </div>
              </div>

              {errored[attachment.filename] ? (
                <p className="error-text">{t('appointments.attachmentError')}</p>
              ) : url ? (
                isVideo
                  ? <video controls src={url} className="w-full rounded-control bg-ink" />
                  : <audio controls src={url} className="w-full h-10" />
              ) : (
                <Button
                  size="sm" variant="secondary" block
                  loading={loadingKey === attachment.filename}
                  onClick={() => open(attachment)}
                >
                  {loadingKey === attachment.filename ? t('appointments.loadingAttachment') : t('appointments.playAttachment')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
