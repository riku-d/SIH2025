import React from 'react'
import { useTranslation } from 'react-i18next'
import { renderMarkdownSafely } from '../../../lib/aiSafety'
import Alert from '../../ui/Alert'
import Button from '../../ui/Button'
import Citations from './Citations'
import ActionCards from './ActionCards'

/** Attached photos live inside the user's own bubble, not in a detached tray. */
function Attachments({ files }) {
  const { t } = useTranslation()
  if (!files?.length) return null
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {files.map((f, i) => (
        f.mimeType?.startsWith('image/') ? (
          <img
            key={i}
            src={`data:${f.mimeType};base64,${f.data}`}
            alt={t('assistant.attachedPhoto')}
            className="max-h-32 rounded-control border border-white/25"
          />
        ) : (
          <span key={i} className="badge badge-neutral">{f.mimeType}</span>
        )
      ))}
    </div>
  )
}

function UserBubble({ message, onRetry }) {
  const { t } = useTranslation()
  const failed = message.sendState === 'failed'

  return (
    <li className="flex flex-col items-end gap-1">
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-sheet rounded-br-sm px-4 py-3 transition-opacity
                       ${failed ? 'bg-primary-600/60 text-white' : 'bg-primary-600 text-white'}
                       ${message.sendState === 'sending' ? 'opacity-70' : ''}`}>
        <Attachments files={message.files} />
        {message.text && <p className="whitespace-pre-wrap text-base">{message.text}</p>}
      </div>

      {/* Delivery is the user's own message, so its state belongs here and
          not on the reply. Nothing is shown once it is safely sent. */}
      {message.sendState === 'sending' && (
        <span className="text-caption text-muted">{t('assistant.sending')}</span>
      )}
      {failed && (
        <button
          type="button"
          onClick={onRetry}
          className="text-caption text-danger-500 font-medium hover:underline min-h-touch"
        >
          {t('assistant.notSent')}
        </button>
      )}
    </li>
  )
}

function TypingDots() {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label={t('assistant.thinking')}>
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function AssistantBubble({ message, onRetry, isLast, canSpeak, speaking, onToggleSpeech }) {
  const { t } = useTranslation()
  const streaming = message.status === 'streaming'
  const failed = message.status === 'error'

  return (
    <li className="flex flex-col gap-2.5 items-start">
      {/* Escalation sits above the answer: it must be readable before the
          patient starts working through first-aid steps. */}
      {message.urgent && (
        <Alert
          tone="error"
          title={t('symptomChecker.urgentTitle')}
          className="w-full"
          action={<a href="tel:108" className="btn btn-danger btn-sm">{t('symptomChecker.callAmbulance')}</a>}
        >
          {t('symptomChecker.urgent')}
        </Alert>
      )}

      <div className="max-w-[92%] sm:max-w-[80%] rounded-sheet rounded-bl-sm bg-surface border border-line px-4 py-3 shadow-rest">
        {/* Saying so matters: this answer is a stored one, not a reply to
            what they actually asked. */}
        {message.offline && (
          <p className="text-caption text-warning-600 font-medium mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 13a10 10 0 014-2.5M2 9a15 15 0 015-3.2M12 20h.01" />
            </svg>
            {t(message.offlineReason === 'busy' ? 'assistant.savedAnswerBusy' : 'assistant.offlineNote')}
          </p>
        )}
        {message.text
          ? <div className="ai-prose" dangerouslySetInnerHTML={{ __html: renderMarkdownSafely(message.text) }} />
          : streaming && <TypingDots />}

        {/* A caret while streaming tells the user text is still arriving,
            which a static block of prose cannot. */}
        {streaming && message.text && (
          <span className="inline-block w-1.5 h-4 -mb-0.5 ml-0.5 bg-primary-500 animate-pulse" aria-hidden="true" />
        )}
      </div>

      {/* The answer stopped mid-sentence. Saying so beats letting someone
          act on guidance that never reached "see a doctor if…". */}
      {message.truncated && message.status !== 'streaming' && (
        <Alert tone="warning" className="w-full max-w-[92%] sm:max-w-[80%]">
          {t('assistant.truncated')}
        </Alert>
      )}

      {message.status !== 'streaming' && message.citations?.length > 0 && (
        <>
          <ActionCards citations={message.citations} />
          <Citations items={message.citations} />
        </>
      )}

      {/* Read-aloud on every answer, not only spoken ones: a user who typed
          may still prefer to listen, and some cannot read the reply at all. */}
      {canSpeak && (message.spoken || message.text) && message.status !== 'streaming' && (
        <button
          type="button"
          onClick={onToggleSpeech}
          className="inline-flex items-center gap-1.5 -mt-0.5 px-2 py-1 rounded-control text-caption
                     text-muted hover:text-primary-700 hover:bg-primary-50 transition-colors min-h-touch"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {speaking
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h2v6H9zM13 9h2v6h-2z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6.5 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2.5L11 19V5zM15.5 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10" />}
          </svg>
          {speaking ? t('assistant.stopListening') : t('assistant.listen')}
        </button>
      )}

      {failed && (
        <div className="flex flex-col gap-2 w-full max-w-[92%] sm:max-w-[80%]">
          <Alert tone="error">
            {t(`assistant.errors.${message.errorCode || 'unknown'}`, t('assistant.errors.unknown'))}
          </Alert>
          {/* Retry is per message: a failed turn must not cost the user
              what they already said. */}
          {isLast && (
            <Button variant="secondary" size="sm" className="self-start" onClick={onRetry}>
              {t('assistant.retry')}
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

export default function MessageBubble({ message, onRetry, isLast, canSpeak, speaking, onToggleSpeech }) {
  return message.role === 'user'
    ? <UserBubble message={message} onRetry={onRetry} />
    : <AssistantBubble
        message={message}
        onRetry={onRetry}
        isLast={isLast}
        canSpeak={canSpeak}
        speaking={speaking}
        onToggleSpeech={onToggleSpeech}
      />
}
