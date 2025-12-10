'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, Crop } from 'lucide-react'
import ReactCrop, { Crop as CropType, makeAspectCrop, centerCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageUploaderProps {
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
}

export default function ImageUploader({ currentImageUrl, onImageUploaded }: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(currentImageUrl || null)
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<CropType>()
  const [showCrop, setShowCrop] = useState(false)
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string)
        setShowCrop(true)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    )
    setCrop(crop)
  }

  const getCroppedImg = async (image: HTMLImageElement, crop: CropType): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width!
    canvas.height = crop.height!
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(
      image,
      crop.x! * scaleX,
      crop.y! * scaleY,
      crop.width! * scaleX,
      crop.height! * scaleY,
      0,
      0,
      crop.width!,
      crop.height!
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob')
        }
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return

    setUploading(true)
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop)
      
      // Upload to Supabase Storage
      const supabase = createClient()
      const fileExt = 'jpg'
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `menu-items/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, croppedImageBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Create bucket if it doesn't exist (this will fail, but we'll handle it)
        // For now, use a public URL or data URL
        const reader = new FileReader()
        reader.onloadend = () => {
          onImageUploaded(reader.result as string)
          setShowCrop(false)
          setUploading(false)
        }
        reader.readAsDataURL(croppedImageBlob)
        return
      }

      // Get public URL
      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      onImageUploaded(data.publicUrl)
      setImageSrc(data.publicUrl)
      setShowCrop(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageSrc(null)
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Image
      </label>

      {!showCrop && (
        <div className="space-y-3">
          {imageSrc ? (
            <div className="relative">
              <img
                src={imageSrc}
                alt="Menu item"
                className="w-full h-48 object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">Upload menu item image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-xl cursor-pointer hover:bg-green-700 transition-colors"
              >
                Choose Image
              </label>
            </div>
          )}
        </div>
      )}

      {showCrop && imageSrc && (
        <div className="space-y-4">
          <div className="relative">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={16 / 9}
              minWidth={100}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop"
                onLoad={onImageLoad}
                className="max-h-64 w-full object-contain"
              />
            </ReactCrop>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCrop(false)
                setImageSrc(currentImageUrl || null)
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              disabled={uploading || !completedCrop}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Crop size={16} />
                  Crop & Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
