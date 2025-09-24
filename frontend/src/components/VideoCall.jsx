import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import Peer from 'simple-peer'

const socket = io(import.meta.env.VITE_SIGNAL_URL || 'http://localhost:5000')

export default function VideoCall({ roomId }) {
  const myVideo = useRef(null)
  const userVideo = useRef(null)
  const [peer, setPeer] = useState(null)

  useEffect(() => {
    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (myVideo.current) myVideo.current.srcObject = stream
      socket.emit('join-room', roomId)
      socket.on('user-joined', (id) => {
        const p = new Peer({ initiator: true, trickle: false, stream })
        p.on('signal', data => socket.emit('signal', { roomId, data }))
        socket.on('signal', ({ from, data }) => { if (!p.destroyed) p.signal(data) })
        p.on('stream', userStream => { if (userVideo.current) userVideo.current.srcObject = userStream })
        setPeer(p)
      })
      socket.on('signal', ({ from, data }) => {
        if (!peer) {
          const p = new Peer({ initiator: false, trickle: false, stream })
          p.on('signal', s => socket.emit('signal', { roomId, data: s }))
          p.on('stream', userStream => { if (userVideo.current) userVideo.current.srcObject = userStream })
          p.signal(data)
          setPeer(p)
        }
      })
    }
    start()
    return () => { socket.off('user-joined'); socket.off('signal'); if (peer) peer.destroy() }
  }, [roomId])

  return (
    <div className="card">
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <video ref={myVideo} autoPlay muted className="w-full bg-black rounded" />
          <video ref={userVideo} autoPlay className="w-full bg-black rounded" />
        </div>
      </div>
    </div>
  )
}


