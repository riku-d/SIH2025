import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import SimpleWebRTC from '../utils/SimpleWebRTC'
import Card, { CardBody } from './ui/Card'
import Button, { IconButton } from './ui/Button'
import Avatar from './ui/Avatar'
import Alert from './ui/Alert'

/**
 * The socket is created when a call actually starts rather than at module
 * import time, so loading any page that touched this module no longer
 * opened a connection.
 */
function createSocket() {
  return io(import.meta.env.VITE_SIGNAL_URL || 'http://localhost:5000')
}

export default function VideoCall({ roomId, perspective = 'patient', onLeave }) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const myVideo = useRef(null)
  const remoteVideo = useRef(null)
  const socketRef = useRef(null)
  const peerRef = useRef(null)
  const streamRef = useRef(null)

  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [audioOn, setAudioOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [counterpart, setCounterpart] = useState(null)

  const counterpartLabel = counterpart?.name
    || (perspective === 'patient' ? t('consultation.otherPerson') : t('consultation.otherPersonPatient'))

  // Show who the patient is waiting for, instead of a raw Mongo id.
  // There is no GET /appointments/:id, so this reads the caller's own
  // list — an endpoint that already exists — and picks this appointment.
  useEffect(() => {
    if (!roomId || !userId) return
    let cancelled = false
    const listUrl = perspective === 'patient'
      ? `/appointments/patient/${userId}`
      : `/appointments/doctor/${userId}`

    api.get(listUrl)
      .then(({ data }) => {
        if (cancelled) return
        const appointment = (data || []).find(a => a._id === roomId)
        setCounterpart(perspective === 'patient' ? appointment?.doctorId : appointment?.patientId)
      })
      .catch(() => { /* A name is a nicety; the call works without it. */ })
    return () => { cancelled = true }
  }, [roomId, perspective, userId])

  const cleanup = useCallback(() => {
    try { peerRef.current?.destroy?.() } catch { /* already gone */ }
    peerRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    socketRef.current?.disconnect()
    socketRef.current = null
  }, [])

  const endCall = async () => {
    try {
      if (roomId && connected) await api.put(`/appointments/${roomId}/complete`)
    } catch (err) {
      console.error('Could not mark the appointment complete:', err)
    } finally {
      cleanup()
      onLeave?.()
    }
  }

  useEffect(() => {
    if (!roomId) return
    if (!SimpleWebRTC.WEBRTC_SUPPORT) {
      setError(t('consultation.errors.unsupported'))
      return
    }

    let disposed = false
    const socket = createSocket()
    socketRef.current = socket

    const makePeer = (initiator, stream, signalData) => {
      const peer = new SimpleWebRTC({ initiator, stream })
      peer.on('signal', (data) => socket.emit('signal', { roomId, data }))
      peer.on('stream', (remote) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = remote
        setConnected(true)
      })
      peer.on('connect', () => setConnected(true))
      peer.on('close', () => setConnected(false))
      peer.on('error', (err) => {
        console.error('Peer error:', err)
        setError(t('consultation.errors.connection'))
        setConnected(false)
      })
      if (signalData) peer.signal(signalData)
      return peer
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (disposed) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = stream
        if (myVideo.current) myVideo.current.srcObject = stream

        socket.emit('join-room', roomId)

        socket.on('user-joined', () => {
          if (!peerRef.current) peerRef.current = makePeer(true, stream)
        })

        socket.on('signal', ({ data }) => {
          if (!peerRef.current) peerRef.current = makePeer(false, stream, data)
          else { try { peerRef.current.signal(data) } catch (err) { console.error('Signal failed:', err) } }
        })

        socket.on('call-ended', () => { setConnected(false); cleanup(); onLeave?.() })
        socket.on('disconnect', () => setConnected(false))
      } catch (err) {
        console.error('Could not start the call:', err)
        setError(err.name === 'NotAllowedError'
          ? t('consultation.errors.permission')
          : t('consultation.errors.generic'))
      }
    }

    start()
    return () => { disposed = true; cleanup() }
  }, [roomId, t, cleanup, onLeave])

  const toggleAudio = () => {
    const tracks = streamRef.current?.getAudioTracks() || []
    tracks.forEach(track => { track.enabled = !track.enabled })
    setAudioOn(tracks[0]?.enabled ?? true)
  }

  const toggleVideo = () => {
    const tracks = streamRef.current?.getVideoTracks() || []
    tracks.forEach(track => { track.enabled = !track.enabled })
    setVideoOn(tracks[0]?.enabled ?? true)
  }

  if (!roomId) {
    return <Card><CardBody><Alert tone="warning">{t('consultation.errors.noRoom')}</Alert></CardBody></Card>
  }

  if (error) {
    return (
      <Card>
        <CardBody className="flex flex-col gap-4">
          <Alert tone="error">{error}</Alert>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
            <Button variant="secondary" onClick={() => { cleanup(); onLeave?.() }}>{t('consultation.leave')}</Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="p-0 sm:p-0">
        {/* Remote fills the frame; you are a thumbnail. Two equal 300px
            boxes made the person you're talking to the same size as your
            own preview on a phone. */}
        <div className="relative bg-ink rounded-t-card overflow-hidden aspect-[4/3] sm:aspect-video">
          <video
            ref={remoteVideo} autoPlay playsInline
            className={`w-full h-full object-cover ${connected ? '' : 'invisible'}`}
          />

          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Avatar name={counterpartLabel} size="xl" className="bg-white/15 text-white" />
              <div>
                <p className="text-white font-medium mb-1">
                  {streamRef.current
                    ? t('consultation.waiting', { name: counterpartLabel })
                    : t('consultation.preparing')}
                </p>
                <p className="text-white/70 text-small max-w-xs">{t('consultation.waitingHelp')}</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 w-28 sm:w-40 aspect-video rounded-control overflow-hidden border-2 border-white/25 bg-ink shadow-raised">
            <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!videoOn && (
              <span className="absolute inset-0 flex items-center justify-center text-white/80 text-caption text-center px-1">
                {t('consultation.cameraOff')}
              </span>
            )}
          </div>

          {connected && (
            <span className="absolute top-3 left-3 badge bg-black/55 text-white border-white/20">
              {counterpartLabel}
            </span>
          )}
        </div>

        {/* Labelled controls with real touch targets, replacing 🔊 📹 📞. */}
        <div className="flex items-center justify-center gap-3 p-4">
          <IconButton
            label={audioOn ? t('consultation.muteOn') : t('consultation.muteOff')}
            variant={audioOn ? 'secondary' : 'danger'}
            onClick={toggleAudio}
            aria-pressed={!audioOn}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {audioOn
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9 9v3a3 3 0 004.5 2.6M15 9.3V6a3 3 0 00-5.9-.7M19 11a7 7 0 01-1.2 3.9M5 11a7 7 0 0010.3 6.2M12 18v3" />}
            </svg>
          </IconButton>

          <IconButton
            label={videoOn ? t('consultation.videoOn') : t('consultation.videoOff')}
            variant={videoOn ? 'secondary' : 'danger'}
            onClick={toggleVideo}
            aria-pressed={!videoOn}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {videoOn
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.5-2.25v8.5L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M15 10l4.5-2.25v8.5L15 14M10 6h3a2 2 0 012 2v3M5 18h8a2 2 0 002-2M3 8a2 2 0 012-2" />}
            </svg>
          </IconButton>

          <Button variant="danger" onClick={endCall} className="px-5">
            {t('consultation.endCall')}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
