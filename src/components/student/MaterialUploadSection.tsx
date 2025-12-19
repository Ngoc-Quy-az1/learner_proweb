import { useState, useEffect } from 'react'
import { Upload, FileText, X, Edit2, Save, XCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { apiCall, API_BASE_URL } from '../../config/api'
import { getCookie } from '../../utils/cookies'
import { processImageFile, isImageFile } from '../../utils/imageProcessor'

export interface ScheduleMaterialItem {
  id: string
  name: string
  url: string
  description?: string
  uploadedAt?: string
}

interface ScheduleApiItem {
  id: string
  startTime: string
  duration: number
  subjectCode?: string
  studentId?: string
  tutorId?: { id?: string; name?: string; fullName?: string } | string
  meetingURL?: string
  note?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  reportURL?: string
  createdAt?: string
  updatedAt?: string
  supplementaryMaterials?: Array<{
    name?: string
    documentURL?: string
    url?: string
    description?: string
    requirement?: string
  }>
}

interface ScheduleOption {
  id: string
  subject: string
  date: Date
}

interface MaterialUploadSectionProps {
  scheduleOptions: ScheduleOption[]
  selectedScheduleId: string | null
  onScheduleChange: (scheduleId: string) => void
  onUploadSuccess: () => void
}

// Normalize URL - ensure it's a full URL
const normalizeUrl = (url: string): string => {
  if (!url) return ''
  // If already a full URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // If starts with /, it's a relative path, prepend API_BASE_URL
  if (url.startsWith('/')) {
    // Remove /v1 if present in API_BASE_URL to avoid double /v1
    const baseUrl = API_BASE_URL.replace(/\/v1$/, '')
    return `${baseUrl}${url}`
  }
  // Otherwise, prepend API_BASE_URL
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

// Check if URL is an image
const isImageUrl = (url: string): boolean => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

const uploadSupplementaryFiles = async (files: File[]): Promise<{ name: string; url: string }[]> => {
  if (files.length === 0) return []

  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const accessToken = getCookie('accessToken')

  const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
    method: 'POST',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Không thể tải file. Vui lòng thử lại.')
  }

  const data = await response.json()

  const normalizeFiles = (items: Array<{ name?: string; url?: string }> = []) =>
    items
      .map((item, index) => ({
        name: item.name || files[index]?.name || `Tài liệu ${index + 1}`,
        url: item.url || '',
      }))
      .filter((item) => item.url)

  if (Array.isArray(data.files)) {
    const normalized = normalizeFiles(data.files)
    if (normalized.length > 0) return normalized
  }

  if (Array.isArray(data.file)) {
    const normalized = normalizeFiles(data.file)
    if (normalized.length > 0) return normalized
  }

  if (Array.isArray(data.urls)) {
    const normalized = normalizeFiles(data.urls.map((url: string) => ({ url })))
    if (normalized.length > 0) return normalized
  }

  const singleUrl = data.url || data.file?.url
  if (singleUrl) {
    return [{ name: files[0].name, url: singleUrl }]
  }

  throw new Error('Không nhận được link file từ máy chủ.')
}

export default function MaterialUploadSection({
  scheduleOptions,
  selectedScheduleId,
  onScheduleChange,
  onUploadSuccess,
}: MaterialUploadSectionProps) {
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [parentNote, setParentNote] = useState('')
  const [uploadingMaterials, setUploadingMaterials] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [materials, setMaterials] = useState<ScheduleMaterialItem[]>([])
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<{ name: string; description: string } | null>(null)
  const [replacingMaterialId, setReplacingMaterialId] = useState<string | null>(null)
  const [fileObjectUrls, setFileObjectUrls] = useState<Record<number, string>>({})

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      // Cleanup all object URLs on unmount
      Object.values(fileObjectUrls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  // Cleanup object URLs when files are removed
  useEffect(() => {
    const currentFileIndices = new Set(filesToUpload.map((_, index) => index))
    const urlsToRevoke: number[] = []
    
    Object.keys(fileObjectUrls).forEach(indexStr => {
      const index = parseInt(indexStr)
      if (!currentFileIndices.has(index)) {
        urlsToRevoke.push(index)
      }
    })

    urlsToRevoke.forEach(index => {
      URL.revokeObjectURL(fileObjectUrls[index])
      setFileObjectUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[index]
        return newUrls
      })
    })
  }, [filesToUpload.length])

  // Fetch materials from schedule detail
  useEffect(() => {
    const fetchScheduleMaterials = async () => {
      if (!selectedScheduleId) {
        setMaterials([])
        return
      }

      try {
        const scheduleDetail = await apiCall<ScheduleApiItem>(`/schedules/${selectedScheduleId}`)
        const materialsList: ScheduleMaterialItem[] = []
        
        if (scheduleDetail.supplementaryMaterials && Array.isArray(scheduleDetail.supplementaryMaterials)) {
          scheduleDetail.supplementaryMaterials.forEach((material, index) => {
            const materialUrl = material.documentURL || material.url
            if (materialUrl) {
              materialsList.push({
                id: `${selectedScheduleId}-${index}`,
                name: material.name || `Tài liệu ${index + 1}`,
                url: materialUrl,
                uploadedAt: scheduleDetail.updatedAt || scheduleDetail.createdAt,
                description: material.requirement || material.description,
              })
            }
          })
        }

        setMaterials(materialsList)
      } catch (error) {
        console.error('Failed to fetch schedule materials:', error)
        setMaterials([])
      }
    }

    fetchScheduleMaterials()
  }, [selectedScheduleId, onUploadSuccess])

  const handleMaterialFilesSelected = async (fileList: FileList | null) => {
    if (!fileList) return
    
    const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
    const selectedFiles = Array.from(fileList)
    const invalidFiles: string[] = []
    
    // Process image files first
    const processedFiles: File[] = []
    for (const file of selectedFiles) {
      // Kiểm tra kích thước file gốc
      if (file.size > MAX_FILE_SIZE && !isImageFile(file)) {
        invalidFiles.push(file.name)
        continue
      }
      
      // Process image files to reduce size
      if (isImageFile(file)) {
        try {
          const processed = await processImageFile(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            maxSizeMB: 2
          })
          processedFiles.push(processed)
        } catch (error) {
          console.warn('Image processing failed, using original:', error)
          // If processing fails, check original size
          if (file.size > MAX_FILE_SIZE) {
            invalidFiles.push(file.name)
          } else {
            processedFiles.push(file)
          }
        }
      } else {
        // Non-image files, check size only
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(file.name)
        } else {
          processedFiles.push(file)
        }
      }
    }
    
    // Nếu có file quá lớn, hiển thị thông báo lỗi
    if (invalidFiles.length > 0) {
      const fileList = invalidFiles.length === 1 
        ? invalidFiles[0] 
        : invalidFiles.join(', ')
      const message = invalidFiles.length === 1
        ? `File "${fileList}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`
        : `Các file sau vượt quá 15MB: ${fileList}. Vui lòng chọn file nhỏ hơn.`
      setUploadError(message)
      // Chỉ thêm các file hợp lệ
      if (processedFiles.length > 0) {
        setFilesToUpload((prev) => {
          const newFiles = [...prev, ...processedFiles]
          // Create object URLs for new files
          const newUrls: Record<number, string> = {}
          processedFiles.forEach((file, offset) => {
            const index = prev.length + offset
            newUrls[index] = URL.createObjectURL(file)
          })
          setFileObjectUrls(prevUrls => ({ ...prevUrls, ...newUrls }))
          return newFiles
        })
      }
      return
    }
    
    // Nếu tất cả file đều hợp lệ, thêm vào danh sách
    setFilesToUpload((prev) => {
      const newFiles = [...prev, ...processedFiles]
      // Create object URLs for new files
      const newUrls: Record<number, string> = {}
      processedFiles.forEach((file, offset) => {
        const index = prev.length + offset
        newUrls[index] = URL.createObjectURL(file)
      })
      setFileObjectUrls(prevUrls => ({ ...prevUrls, ...newUrls }))
      return newFiles
    })
    // Clear error nếu upload thành công
    setUploadError(null)
  }

  const handleRemovePendingFile = (index: number) => {
    // Revoke object URL before removing file
    if (fileObjectUrls[index]) {
      URL.revokeObjectURL(fileObjectUrls[index])
      setFileObjectUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[index]
        return newUrls
      })
    }
    setFilesToUpload((prev) => {
      const newFiles = prev.filter((_, idx) => idx !== index)
      // Recreate object URLs for remaining files with new indices
      const newUrls: Record<number, string> = {}
      newFiles.forEach((file, newIndex) => {
        newUrls[newIndex] = URL.createObjectURL(file)
      })
      // Revoke old URLs
      Object.values(fileObjectUrls).forEach(url => URL.revokeObjectURL(url))
      setFileObjectUrls(newUrls)
      return newFiles
    })
  }

  const handleUploadMaterials = async () => {
    if (!selectedScheduleId) {
      setUploadError('Vui lòng chọn buổi học muốn gửi tài liệu.')
      return
    }
    if (filesToUpload.length === 0) {
      setUploadError('Vui lòng chọn ít nhất một tài liệu trước khi gửi.')
      return
    }

    setUploadingMaterials(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const uploadedMaterials = await uploadSupplementaryFiles(filesToUpload)

      // Lấy materials hiện tại từ schedule
      const currentSchedule = await apiCall<ScheduleApiItem>(`/schedules/${selectedScheduleId}`)
      const existingMaterials = currentSchedule.supplementaryMaterials || []

      // Merge materials mới với materials cũ
      const allMaterials = [
        ...existingMaterials.map(m => ({
          name: m.name || m.documentURL || '',
          documentURL: m.documentURL || m.url || '',
          description: m.description || m.requirement,
        })),
        ...uploadedMaterials.map((file, index) => ({
          name: file.name || `Tài liệu ${index + 1}`,
          documentURL: file.url,
          description: parentNote || undefined,
        })),
      ]

      await apiCall(`/schedules/${selectedScheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplementaryMaterials: allMaterials,
        }),
      })

      setUploadSuccess('Đã gửi tài liệu cho Tutor thành công!')
      setFilesToUpload([])
      setParentNote('')
      onUploadSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi tài liệu cho Tutor'
      setUploadError(message)
    } finally {
      setUploadingMaterials(false)
    }
  }

  const handleDeleteMaterial = async (materialUrl: string) => {
    if (!selectedScheduleId) return

    try {
      // Lấy materials hiện tại
      const currentSchedule = await apiCall<ScheduleApiItem>(`/schedules/${selectedScheduleId}`)
      const existingMaterials = currentSchedule.supplementaryMaterials || []

      // Xóa material có URL trùng
      const updatedMaterials = existingMaterials.filter(
        m => (m.documentURL || m.url) !== materialUrl
      )

      await apiCall(`/schedules/${selectedScheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplementaryMaterials: updatedMaterials.map(m => ({
            name: m.name || '',
            documentURL: m.documentURL || m.url || '',
            description: m.description || m.requirement,
          })),
        }),
      })

      onUploadSuccess()
      setUploadSuccess('Đã xóa tài liệu thành công!')
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to delete material:', error)
      setUploadError('Không thể xóa tài liệu. Vui lòng thử lại.')
      setTimeout(() => setUploadError(null), 3000)
    }
  }

  const handleStartEdit = (material: ScheduleMaterialItem) => {
    setEditingMaterialId(material.id)
    setEditingMaterial({
      name: material.name,
      description: material.description || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingMaterialId(null)
    setEditingMaterial(null)
  }

  const handleSaveEdit = async (materialId: string, materialUrl: string) => {
    if (!selectedScheduleId || !editingMaterial) return

    try {
      // Lấy materials hiện tại
      const currentSchedule = await apiCall<ScheduleApiItem>(`/schedules/${selectedScheduleId}`)
      const existingMaterials = currentSchedule.supplementaryMaterials || []

      // Cập nhật material
      const updatedMaterials = existingMaterials.map((m) => {
        const currentId = (m as { _id?: string })._id
        const matchesMaterial = (currentId && currentId === materialId) || (m.documentURL || m.url) === materialUrl
        if (matchesMaterial) {
          return {
            name: editingMaterial.name || m.name || '',
            documentURL: m.documentURL || m.url || '',
            description: editingMaterial.description || m.description || m.requirement,
          }
        }
        return {
          name: m.name || '',
          documentURL: m.documentURL || m.url || '',
          description: m.description || m.requirement,
        }
      })

      await apiCall(`/schedules/${selectedScheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplementaryMaterials: updatedMaterials,
        }),
      })

      onUploadSuccess()
      setEditingMaterialId(null)
      setEditingMaterial(null)
      setUploadSuccess('Đã cập nhật tài liệu thành công!')
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to update material:', error)
      setUploadError('Không thể cập nhật tài liệu. Vui lòng thử lại.')
      setTimeout(() => setUploadError(null), 3000)
    }
  }

  const handleReplaceFile = async (materialId: string, materialUrl: string, file: File) => {
    if (!selectedScheduleId) return

    try {
      setReplacingMaterialId(materialId)
      setUploadError(null)

      // Process image files before upload
      let processedFile = file
      if (isImageFile(file)) {
        try {
          processedFile = await processImageFile(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            maxSizeMB: 2
          })
        } catch (error) {
          console.warn('Image processing failed, using original:', error)
          // Check original size if processing fails
          const MAX_FILE_SIZE = 15 * 1024 * 1024
          if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
            setTimeout(() => setUploadError(null), 5000)
            setReplacingMaterialId(null)
            return
          }
        }
      } else {
        // Kiểm tra kích thước file không phải ảnh (15MB)
        const MAX_FILE_SIZE = 15 * 1024 * 1024
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
          setTimeout(() => setUploadError(null), 5000)
          setReplacingMaterialId(null)
          return
        }
      }

      // Upload file mới (đã được xử lý nếu là ảnh)
      const uploadedFiles = await uploadSupplementaryFiles([processedFile])
      if (uploadedFiles.length === 0) {
        throw new Error('Không thể tải file mới')
      }

      const newFileUrl = uploadedFiles[0].url

      // Lấy materials hiện tại
      const currentSchedule = await apiCall<ScheduleApiItem>(`/schedules/${selectedScheduleId}`)
      const existingMaterials = currentSchedule.supplementaryMaterials || []

      // Thay thế material cũ bằng material mới
      const updatedMaterials = existingMaterials.map(m => {
        if ((m.documentURL || m.url) === materialUrl) {
          return {
            name: file.name || m.name || '',
            documentURL: newFileUrl,
            description: m.description || m.requirement,
          }
        }
        return {
          name: m.name || '',
          documentURL: m.documentURL || m.url || '',
          description: m.description || m.requirement,
        }
      })

      await apiCall(`/schedules/${selectedScheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplementaryMaterials: updatedMaterials,
        }),
      })

      onUploadSuccess()
      setReplacingMaterialId(null)
      setUploadSuccess('Đã thay thế tài liệu thành công!')
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to replace material:', error)
      setUploadError('Không thể thay thế tài liệu. Vui lòng thử lại.')
      setTimeout(() => setUploadError(null), 3000)
      setReplacingMaterialId(null)
    }
  }

  const selectedSchedule = selectedScheduleId
    ? scheduleOptions.find((schedule) => schedule.id === selectedScheduleId) || null
    : null

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Upload className="w-6 h-6 text-primary-600 flex-shrink-0" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tải tài liệu cho Tutor</h2>
      </div>
      {scheduleOptions.length === 0 ? (
        <p className="text-base text-gray-500 py-4">Hiện chưa có buổi học nào để gửi tài liệu thêm cho Tutor.</p>
      ) : (
        <div className="space-y-6">
          {scheduleOptions.length > 1 ? (
            <div>
              <label className="text-base font-bold text-gray-900 mb-3 block">Chọn buổi học</label>
              <select
                value={selectedScheduleId ?? ''}
                onChange={(e) => onScheduleChange(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-2xl px-5 py-4 text-base font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white hover:border-primary-400 cursor-pointer"
              >
                {scheduleOptions.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {(schedule.subject && schedule.subject.length > 0 ? schedule.subject : 'Chung')}{' '}
                    · {format(schedule.date, 'dd/MM/yyyy HH:mm')}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-base font-bold text-gray-900 mb-3 block">Ghi chú cho Tutor</label>
            <textarea
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="Nhập ghi chú chi tiết"
              rows={4}
              className="w-full border-2 border-gray-300 rounded-2xl px-5 py-4 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white hover:border-primary-400 resize-y min-h-[100px]"
            />
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer bg-gray-50">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                handleMaterialFilesSelected(e.target.files)
                // Reset input để có thể chọn lại file nếu có lỗi
                if (e.target.files && e.target.files.length > 0) {
                  const MAX_FILE_SIZE = 15 * 1024 * 1024
                  const hasInvalidFile = Array.from(e.target.files).some(file => file.size > MAX_FILE_SIZE)
                  if (hasInvalidFile) {
                    // Chỉ reset nếu có file không hợp lệ, để giữ lại các file hợp lệ
                    setTimeout(() => {
                      e.target.value = ''
                    }, 100)
                  }
                }
              }}
            />
            <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <p className="text-lg font-bold text-gray-900 mb-2">
                Click để chọn tài liệu
              </p>
              <p className="text-sm text-gray-600">
                PDF, DOC, DOCX, JPG, PNG (tối đa 15MB/tệp)
              </p>
            </label>
          </div>

          {filesToUpload.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-gray-900">Tài liệu sẽ gửi</p>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                  {filesToUpload.length} {filesToUpload.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filesToUpload.map((file, index) => {
                  const isImage = file.type.startsWith('image/')
                  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
                  const fileUrl = fileObjectUrls[index] || URL.createObjectURL(file)

                  // Ensure URL is stored
                  if (!fileObjectUrls[index]) {
                    setFileObjectUrls(prev => ({ ...prev, [index]: fileUrl }))
                  }

                  return (
                    <div key={`${file.name}-${index}`} className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex flex-col gap-3">
                        {/* Preview Section */}
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2 min-h-[200px]">
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={file.name}
                              className="max-w-full max-h-[180px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              onClick={() => window.open(fileUrl, '_blank')}
                            />
                          ) : isPdf ? (
                            <div className="w-full h-full flex flex-col gap-2">
                              <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-[180px] border border-gray-200 rounded-lg bg-white"
                                title={file.name}
                              />
                              <p className="text-xs font-semibold text-gray-600 text-center">PDF Document</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="w-16 h-16 text-primary-500" />
                              <p className="text-xs font-semibold text-gray-600">Document</p>
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900 break-words line-clamp-2" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          {isPdf && (
                            <button
                              onClick={() => {
                                const newWindow = window.open(fileUrl, '_blank')
                                if (!newWindow) {
                                  // Fallback: try to download if popup blocked
                                  const link = document.createElement('a')
                                  link.href = fileUrl
                                  link.target = '_blank'
                                  link.download = file.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-semibold text-sm"
                              title="Xem PDF trong tab mới"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem PDF</span>
                            </button>
                          )}
                          {isImage && (
                            <button
                              onClick={() => window.open(fileUrl, '_blank')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-semibold text-sm"
                              title="Xem ảnh"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePendingFile(index)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-semibold text-sm ${(isImage || isPdf) ? 'flex-1' : 'w-full'}`}
                            title="Xóa"
                          >
                            <X className="w-4 h-4" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-base font-semibold text-red-700">{uploadError}</p>
            </div>
          )}
          {uploadSuccess && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-base font-semibold text-green-700">{uploadSuccess}</p>
            </div>
          )}

          <button
            onClick={handleUploadMaterials}
            disabled={uploadingMaterials || !selectedSchedule || filesToUpload.length === 0}
            className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${
              uploadingMaterials || !selectedSchedule || filesToUpload.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-xl transform hover:scale-[1.02]'
            }`}
          >
            <Upload className="w-5 h-5" />
            {uploadingMaterials ? 'Đang gửi tài liệu...' : 'Gửi tài liệu cho Tutor'}
          </button>

          {/* Uploaded Files List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
              <p className="text-lg font-bold text-gray-900">Tài liệu đã gửi</p>
              {materials.length > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {materials.length} {materials.length === 1 ? 'file' : 'files'}
                </span>
              )}
            </div>
            {materials.length === 0 ? (
              <p className="text-base text-gray-500 py-6 text-center">Chưa có tài liệu nào được gửi cho buổi học này.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materials.map((material) => {
                  const normalizedUrl = normalizeUrl(material.url)
                  const isImage = isImageUrl(material.url)
                  const isEditing = editingMaterialId === material.id
                  const isReplacing = replacingMaterialId === material.id

                  return (
                    <div key={material.id} className="p-3 sm:p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-bold text-gray-900 mb-2 block">Tên tài liệu</label>
                            <input
                              type="text"
                              value={editingMaterial?.name || ''}
                              onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Nhập tên tài liệu"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-900 mb-2 block">Mô tả/Ghi chú</label>
                            <textarea
                              value={editingMaterial?.description || ''}
                              onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, description: e.target.value } : null)}
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              rows={3}
                              placeholder="Nhập mô tả hoặc ghi chú"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSaveEdit(material.id, material.url)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white text-base font-bold rounded-xl hover:bg-primary-600 transition-colors"
                            >
                              <Save className="w-5 h-5" />
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 text-base font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Preview Section */}
                          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[120px] mb-4">
                            {isImage ? (
                              <img
                                src={normalizedUrl}
                                alt={material.name}
                                className="max-w-full max-h-[100px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                onClick={() => window.open(normalizedUrl, '_blank')}
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent && !parent.querySelector('.error-message')) {
                                    const errorMsg = document.createElement('p')
                                    errorMsg.className = 'error-message text-sm text-red-500 font-semibold'
                                    errorMsg.textContent = 'Không thể tải ảnh'
                                    parent.appendChild(errorMsg)
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="w-16 h-16 text-primary-500" />
                                <p className="text-sm font-semibold text-gray-600">Document</p>
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="space-y-2 mb-4">
                            <p className="text-base font-bold text-gray-900 break-words line-clamp-2" title={material.name}>
                              {material.name}
                            </p>
                            {material.description && (
                              <p className="text-sm text-gray-600 break-words line-clamp-2">{material.description}</p>
                            )}
                            {material.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Tải lên: {format(new Date(material.uploadedAt), 'dd/MM/yyyy HH:mm')}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleStartEdit(material)}
                              className="flex-1 min-w-[80px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4 flex-shrink-0" />
                              <span className="hidden sm:inline">Sửa</span>
                            </button>
                            <button
                              onClick={() => window.open(normalizedUrl, '_blank')}
                              className="flex-1 min-w-[80px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                              title="Xem file"
                            >
                              <Eye className="w-4 h-4 flex-shrink-0" />
                              <span className="hidden sm:inline">Xem</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(material.url)}
                              className="flex-1 min-w-[80px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                              title="Xóa tài liệu"
                            >
                              <X className="w-4 h-4 flex-shrink-0" />
                              <span className="hidden sm:inline">Xóa</span>
                            </button>
                          </div>

                          {/* Thay thế file */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="text-sm font-bold text-gray-900 mb-3 block">Thay thế file</label>
                            <input
                              type="file"
                              id={`replace-file-${material.id}`}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleReplaceFile(material.id, material.url, file)
                                  e.target.value = '' // Reset input
                                }
                              }}
                              disabled={isReplacing}
                            />
                            <label
                              htmlFor={`replace-file-${material.id}`}
                              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                                isReplacing
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-2 border-yellow-200'
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              {isReplacing ? 'Đang thay thế...' : 'Chọn file mới để thay thế'}
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

