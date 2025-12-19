/**
 * Utility functions for image processing before upload
 */

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 to 1.0
  maxSizeMB?: number // Target max size in MB
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 2, // Target 2MB for images
  outputFormat: 'image/jpeg'
}

/**
 * Resize and compress image before upload
 * @param file Original image file
 * @param options Processing options
 * @returns Promise<File> Processed image file
 */
export async function processImageFile(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      // Not an image, return original file
      resolve(file)
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
            width = width * ratio
            height = height * ratio
          }
          
          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Không thể xử lý ảnh'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Không thể nén ảnh'))
                return
              }
              
              // If blob is still too large, compress more
              const targetSize = opts.maxSizeMB * 1024 * 1024
              if (blob.size > targetSize) {
                // Try with lower quality
                compressWithQuality(canvas, targetSize, opts.outputFormat)
                  .then((compressedBlob) => {
                    const processedFile = new File(
                      [compressedBlob],
                      file.name.replace(/\.[^/.]+$/, '') + (opts.outputFormat === 'image/png' ? '.png' : '.jpg'),
                      { type: opts.outputFormat }
                    )
                    resolve(processedFile)
                  })
                  .catch(reject)
              } else {
                const processedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + (opts.outputFormat === 'image/png' ? '.png' : '.jpg'),
                  { type: opts.outputFormat }
                )
                resolve(processedFile)
              }
            },
            opts.outputFormat,
            opts.quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Không thể đọc file ảnh'))
      }
      
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Không thể đọc file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image with decreasing quality until target size is reached
 */
async function compressWithQuality(
  canvas: HTMLCanvasElement,
  targetSize: number,
  format: string
): Promise<Blob> {
  let quality = 0.8
  let step = 0.1
  
  return new Promise((resolve, reject) => {
    const tryCompress = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Không thể nén ảnh'))
            return
          }
          
          if (blob.size <= targetSize || quality <= 0.1) {
            resolve(blob)
          } else {
            quality -= step
            if (quality < 0.1) quality = 0.1
            tryCompress()
          }
        },
        format,
        quality
      )
    }
    
    tryCompress()
  })
}

/**
 * Process multiple image files
 */
export async function processImageFiles(
  files: File[],
  options: ImageProcessingOptions = {}
): Promise<File[]> {
  const results = await Promise.all(
    files.map(file => {
      if (file.type.startsWith('image/')) {
        return processImageFile(file, options)
      }
      return Promise.resolve(file)
    })
  )
  return results
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
