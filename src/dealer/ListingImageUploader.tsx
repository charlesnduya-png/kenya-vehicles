import { useRef, useState } from 'react'
import './ListingImageUploader.css'

const MAX_BYTES = 1.5 * 1024 * 1024
const MAX_IMAGES = 6

type Props = {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

export function ListingImageUploader({ images, onChange, label = 'Photos' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFiles(fileList: FileList | null) {
    setError('')
    if (!fileList?.length) return

    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} photos per listing.`)
      return
    }

    const files = Array.from(fileList).slice(0, room)
    const next: string[] = []

    setBusy(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Please choose image files (PNG, JPG, WebP, or GIF).')
          continue
        }
        if (file.size > MAX_BYTES) {
          setError('Each photo must be under 1.5 MB.')
          continue
        }
        next.push(await readFileAsDataUrl(file))
      }
      if (next.length) onChange([...images, ...next])
    } catch {
      setError('Could not read one of those images. Try another file.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function makePrimary(index: number) {
    if (index === 0) return
    const copy = [...images]
    const [picked] = copy.splice(index, 1)
    onChange([picked, ...copy])
  }

  return (
    <div className="listing-images">
      <div className="listing-images-head">
        <strong>{label}</strong>
        <span>
          {images.length}/{MAX_IMAGES} · first photo is the cover
        </span>
      </div>

      {images.length > 0 && (
        <div className="listing-images-grid">
          {images.map((src, index) => (
            <div key={`${src.slice(0, 48)}-${index}`} className="listing-images-item">
              <img src={src} alt={`Listing photo ${index + 1}`} />
              {index === 0 && <em className="listing-images-cover">Cover</em>}
              <div className="listing-images-item-actions">
                {index > 0 && (
                  <button type="button" onClick={() => makePrimary(index)}>
                    Set cover
                  </button>
                )}
                <button type="button" onClick={() => removeAt(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />

      <div className="listing-images-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={busy || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : images.length ? 'Add more photos' : 'Upload photos'}
        </button>
        {images.length > 0 && (
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={() => onChange([])}
          >
            Clear all
          </button>
        )}
      </div>
      {error && <p className="listing-images-error">{error}</p>}
      <p className="listing-images-hint">PNG, JPG, WebP or GIF · max 1.5 MB each · up to {MAX_IMAGES} photos</p>
    </div>
  )
}
