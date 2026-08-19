import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../translations/i18n'
import { hasRedFlag, renderMarkdownSafely } from '../lib/aiSafety'
import Card, { CardBody, CardHeader } from './ui/Card'
import Button, { IconButton } from './ui/Button'
import Alert from './ui/Alert'
import { Field, Textarea, Select } from './ui/Field'
import { SkeletonText } from './ui/Skeleton'

const HELP_TYPES = [
  { value: 'medical_assistance', prompt: 'medicalAssistance', label: 'medicalAssistance' },
  { value: 'prescription_reader', prompt: 'prescriptionReader', label: 'prescriptionReader' },
  { value: 'medicine_describer', prompt: 'medicineDescriber', label: 'medicineDescriber' },
  { value: 'report_analyzer', prompt: 'reportAnalyzer', label: 'reportAnalyzer' }
]

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result.split(',')[1])
  reader.onerror = reject
})

export default function EnhancedSymptomChecker() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [helpType, setHelpType] = useState('medical_assistance')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)

  const [aiResponse, setAiResponse] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const responseRef = useRef(null)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const reset = () => {
    setTextInput('')
    clearImage()
    setAttachmentFile(null)
    setAiResponse('')
    setUrgent(false)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setAiResponse('')

    if (!textInput.trim() && !imageFile && !attachmentFile) {
      setError(t('symptomChecker.emptyInput'))
      return
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      setError(t('symptomChecker.apiKeyError'))
      return
    }

    // Escalate on the patient's own words, before the model is even called.
    setUrgent(hasRedFlag(textInput))
    setSubmitting(true)

    try {
      const helpConfig = HELP_TYPES.find(h => h.value === helpType) || HELP_TYPES[0]
      const language = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

      // The translated prompts existed in all three locale files from the
      // start but were dead code — a hardcoded English map was used
      // instead, so Hindi and Punjabi users got English answers.
      const systemPrompt = [
        t(`symptomChecker.prompts.${helpConfig.prompt}`),
        t('symptomChecker.responseLanguage', { language: language.label })
      ].join(' ')

      const parts = [{ text: systemPrompt }]
      if (textInput.trim()) parts.push({ text: textInput })
      if (imageFile) {
        parts.push({ inlineData: { mimeType: imageFile.type, data: await fileToBase64(imageFile) } })
      }
      if (attachmentFile) {
        parts.push({ inlineData: { mimeType: attachmentFile.type, data: await fileToBase64(attachmentFile) } })
      }

      const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
        }
      )

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        setError(t('symptomChecker.noResponse'))
        return
      }
      setAiResponse(renderMarkdownSafely(text))
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    } catch (err) {
      console.error('Gemini request failed:', err)
      const status = err.response?.status
      if (status === 401 || status === 403) setError(t('symptomChecker.apiUnauthorized'))
      else if (status === 429) setError(t('symptomChecker.rateLimit'))
      else setError(t('symptomChecker.noResponse'))
    } finally {
      setSubmitting(false)
    }
  }

  const isPdf = attachmentFile?.type === 'application/pdf'

  return (
    // Content only — the component used to wrap itself in min-h-screen
    // bg-gray-50 and its own container inside the dashboard's container.
    <div className="flex flex-col gap-5 max-w-3xl">
      <Card>
        <CardHeader>
          <h2 className="section-title">{t('symptomChecker.title')}</h2>
          <p className="text-small text-muted mt-1.5">{t('symptomChecker.description')}</p>
        </CardHeader>

        <CardBody>
          {/* Part of the component, not something we hope the model says. */}
          <Alert tone="info" title={t('symptomChecker.disclaimerTitle')} className="mb-5">
            {t('symptomChecker.disclaimer')}
          </Alert>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label={t('symptomChecker.helpType')}>
              {(props) => (
                <Select {...props} value={helpType} onChange={(e) => setHelpType(e.target.value)}>
                  {HELP_TYPES.map(h => (
                    <option key={h.value} value={h.value}>{t(`symptomChecker.helpTypes.${h.label}`)}</option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t('symptomChecker.textInput')}>
              {(props) => (
                <Textarea
                  {...props} rows="4" placeholder={t('symptomChecker.textInputPlaceholder')}
                  value={textInput} onChange={(e) => setTextInput(e.target.value)}
                />
              )}
            </Field>

            <Field label={t('symptomChecker.imageInput')} hint={t('symptomChecker.imageInputHint')}>
              {(props) => (
                <input
                  {...props} type="file" accept="image/*" onChange={handleImage}
                  className="block w-full text-small text-muted
                             file:mr-3 file:py-2.5 file:px-4 file:rounded-control file:border file:border-line
                             file:text-small file:font-medium file:bg-surface-2 file:text-ink
                             hover:file:bg-line-soft file:cursor-pointer"
                />
              )}
            </Field>

            {imagePreview && (
              <div className="relative w-fit">
                <img src={imagePreview} alt="" className="max-h-56 rounded-card border border-line" />
                <IconButton
                  label={t('symptomChecker.removeFile')}
                  variant="secondary"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-9 h-9 shadow-rest"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </IconButton>
              </div>
            )}

            <Field label={t('symptomChecker.attachmentInput')} hint={t('symptomChecker.attachmentNote')}>
              {(props) => (
                <input
                  {...props} type="file" accept="image/*,.pdf"
                  onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                  className="block w-full text-small text-muted
                             file:mr-3 file:py-2.5 file:px-4 file:rounded-control file:border file:border-line
                             file:text-small file:font-medium file:bg-surface-2 file:text-ink
                             hover:file:bg-line-soft file:cursor-pointer"
                />
              )}
            </Field>

            {isPdf && <Alert tone="warning">{t('symptomChecker.pdfWarning')}</Alert>}
            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" loading={submitting} block>
              {submitting ? t('symptomChecker.thinking') : t('symptomChecker.getAssistance')}
            </Button>
          </form>
        </CardBody>
      </Card>

      {submitting && (
        <Card>
          <CardBody>
            <p className="text-small text-muted mb-4" role="status">{t('symptomChecker.analyzing')}</p>
            <SkeletonText lines={5} />
          </CardBody>
        </Card>
      )}

      {aiResponse && (
        <div ref={responseRef} className="flex flex-col gap-4">
          {urgent && (
            <Alert tone="error" title={t('symptomChecker.urgentTitle')}>
              {t('symptomChecker.urgent')}
            </Alert>
          )}

          {/* Neutral surface. The old build rendered this in the app's
              success green, which reads as a confirmed diagnosis. */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="badge badge-info">{t('symptomChecker.disclaimerTitle')}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="ai-prose" dangerouslySetInnerHTML={{ __html: aiResponse }} />
            </CardBody>
            <div className="card-footer">
              <p className="text-caption text-muted">{t('symptomChecker.disclaimer')}</p>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Talking to a real doctor is the primary action, not a peer
                of "ask something else". */}
            <Button className="sm:flex-1" onClick={() => navigate('/doctors')}>
              {t('symptomChecker.findDoctor')}
            </Button>
            <Button variant="secondary" className="sm:flex-1" onClick={reset}>
              {t('symptomChecker.checkAnother')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
