import React, { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../../ui/Button'

const ICONS = {
  camera: 'M4 8h3l1.4-2.1a1 1 0 01.83-.45h5.54a1 1 0 01.83.45L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zm8 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  send: 'M4.5 19.5l15.5-7.5L4.5 4.5 4.5 10l9 2-9 2v5.5z',
  stop: 'M8 8h8v8H8z',
  close: 'M6 18L18 6M6 6l12 12'
}

const MAX_ROWS_PX = 132

/**
 * The composer. Photos attach here but render in the sent bubble, so the
 * tray only ever holds what has not been sent yet.
 *
 * The mic sits closest to the send button and is the widest target in the
 * row: for most of our users speaking is the primary way in, and the
 * keyboard is the fallback rather than the reverse.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  files,
  onAttach,
  onRemoveFile,
  disabled,
  mic,
  hint
}) {
  const { t } = useTranslation()
  const textareaRef = useRef(null)
  const fileRef = useRef(null)

  // Grow with the text, but stop before the keyboard has nowhere to go.
  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`
  }, [])

  useEffect(autoGrow, [value, autoGrow])

  /**
   * Measuring again after the first paint. Styles are injected after mount
   * on a cold load, so the mount-time measurement can be taken against the
   * unstyled textarea and then never re-run — leaving an empty composer
   * three lines tall until the user types.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(autoGrow)
    return () => cancelAnimationFrame(frame)
  }, [autoGrow])

  const canSend = !streaming && !disabled && (value.trim() || files.length)

  const submit = (e) => {
    e.preventDefault()
    if (canSend) onSend()
  }

  /**
   * Enter sends where there is a physical keyboard; on a phone it inserts a
   * newline, which is otherwise unreachable. `any-pointer` rather than
   * `pointer`, so a touchscreen laptop — whose primary pointer is coarse but
   * which still has a real Enter key — keeps the shortcut.
   */
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (!window.matchMedia('(any-pointer: fine)').matches) return
    e.preventDefault()
    if (canSend) onSend()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={i} className="relative">
              <img
                src={`data:${f.mimeType};base64,${f.data}`}
                alt={t('assistant.attachedPhoto')}
                className="h-16 w-16 object-cover rounded-control border border-line"
              />
              <button
                type="button"
                onClick={() => onRemoveFile(i)}
                aria-label={t('assistant.removeFile')}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-ink text-white
                           flex items-center justify-center shadow-rest"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" d={ICONS.close} />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { onAttach(e.target.files); e.target.value = '' }}
        />
        <IconButton
          label={t('assistant.attachPhoto')}
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || streaming}
          className="shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.camera} />
          </svg>
        </IconButton>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('assistant.placeholder')}
          aria-label={t('assistant.placeholder')}
          /* textarea.input carries a 96px min-height for form fields, which
             is three empty lines in a chat composer. The bang beats that
             selector's specificity; auto-grow handles the rest. */
          className="input flex-1 resize-none py-2.5 leading-relaxed !min-h-touch"
        />

        {mic}

        {streaming ? (
          <IconButton label={t('assistant.stop')} variant="secondary" onClick={onStop} className="shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d={ICONS.stop} />
            </svg>
          </IconButton>
        ) : (
          <IconButton
            label={t('assistant.send')}
            variant="primary"
            type="submit"
            disabled={!canSend}
            className="shrink-0 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d={ICONS.send} />
            </svg>
          </IconButton>
        )}
      </div>

      {hint && <p className="text-caption text-muted text-center">{hint}</p>}
    </form>
  )
}
