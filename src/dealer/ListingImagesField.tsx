import { useRef, useState } from 'react'
import './ListingImages.css'

const MAX_BYTES = 1.2 * 1024 * 1024
const MAX_IMAGES = 6
const MAX_EDGE = 1280

type Props = {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
}

async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose image files (PNG, JPG, or WebP).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Each image must be under 1.2 MB.')
  }

  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })

  return resizeDataUrl(raw)
}

function resizeDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      if (scale >= 1) {
        resolve(dataUrl)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function ListingImagesField({ images, onChange, label = 'Photos' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  async function onFiles(fileList: FileList | null) {
    setError('')
    if (!fileList?.length) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} photos.`)
      return
    }

    const next = [...images]
    const files = Array.from(fileList).slice(0, room)
    try {
      for (const file of files) {
        next.push(await fileToDataUrl(file))
      }
      onChange(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="listing-images">
      <label>{label}</label>
      <div className="listing-images-grid">
        {images.map((src, index) => (
          <div key={`${index}-${src.slice(0, 24)}`} className="listing-image-tile">
            <img src={src} alt={`Listing photo ${index + 1}`} />
            <button type="button" aria-label="Remove photo" onClick={() => removeAt(index)}>
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            className="listing-image-add"
            onClick={() => inputRef.current?.click()}
          >
            + Upload
            <br />
            photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      <p className="listing-images-hint">
        Up to {MAX_IMAGES} photos · PNG/JPG/WebP · under 1.2 MB each. First photo is the cover.
      </p>
      {error && <p className="listing-images-error">{error}</p>}
    </div>
  )
}
