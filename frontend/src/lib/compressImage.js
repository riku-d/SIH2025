/**
 * Shrinks a photo before it is sent.
 *
 * A prescription photographed on a cheap Android is 3-5MB. The model reads
 * a 1024px JPEG just as well, and on a rural connection the difference is
 * between a few seconds and a failed upload — so this is the single largest
 * bandwidth saving in the assistant.
 */
const MAX_EDGE = 1024
const QUALITY = 0.72
const SKIP_BELOW_BYTES = 180 * 1024

export async function compressImage(file) {
    if (!file.type.startsWith('image/')) return file
    // Already small, or a format where re-encoding loses more than it saves.
    if (file.size < SKIP_BELOW_BYTES || file.type === 'image/gif') return file

    try {
        const bitmap = await createImageBitmap(file)
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)

        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close?.()

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
        if (!blob || blob.size >= file.size) return file // no win, keep the original

        return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
    } catch {
        // A photo that will not decode here may still decode server-side.
        return file
    }
}
