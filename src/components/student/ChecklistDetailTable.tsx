import { useState } from 'react'
import { Layers, Clock, Folder, Lightbulb, Plus, X, Edit2, Loader2 } from 'lucide-react'
import { splitFileUrls } from '../../utils/fileUrlHelper'

export interface ChecklistDetailItem {
  id: string
  lesson: string
  estimatedTime: number
  actualTime: number
  result: 'completed' | 'not_accurate' | 'not_completed'
  qualityNote: string
  solutionType: 'text' | 'file' | 'image'
  solutionText?: string
  solutionFileName?: string
  solutionUrl?: string
  solutionUrls?: string[] // Array of solution file URLs
  solutionPreview?: string
  uploadedFileName?: string
  uploadedFileUrl?: string
  uploadedFileUrls?: string[] // Array of uploaded file URLs
  assignmentFileName?: string
  assignmentUrl?: string
  assignmentUrls?: string[] // Array of assignment file URLs
}

// Helper to parse URLs from string or array
const parseFileUrls = (urls: string | string[] | undefined | null): string[] => {
  if (!urls) return []
  if (Array.isArray(urls)) {
    return urls.filter((url: string) => url && url.trim() !== '')
  }
  if (typeof urls === 'string') {
    return splitFileUrls(urls)
  }
  return []
}

interface ChecklistDetailTableProps {
  items: ChecklistDetailItem[]
  onUpload: (id: string, file: File, fileIndex?: number) => void // fileIndex: undefined = add new, number = replace at index
  onDeleteFile?: (id: string, fileIndex: number) => void // Delete file at specific index
  onStatusChange?: (id: string, status: ChecklistDetailItem['result']) => void
}

export default function ChecklistDetailTable({
  items,
  onUpload,
  onDeleteFile,
  onStatusChange,
}: ChecklistDetailTableProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [expandedUploads, setExpandedUploads] = useState<Record<string, boolean>>({})
  const [dirtyUploads, setDirtyUploads] = useState<Record<string, boolean>>({})
  const MAX_VISIBLE_UPLOADS = 3

  const markDirty = (id: string) => {
    setDirtyUploads(prev => ({
      ...prev,
      [id]: true,
    }))
  }

  const triggerUpload = (id: string, file: File, key: string, fileIndex?: number) => {
    setUploadingKey(key)
    Promise.resolve(onUpload(id, file, fileIndex))
      .catch((error) => {
        console.error('Upload checklist file error:', error)
      })
      .finally(() => {
        setUploadingKey((prev) => (prev === key ? null : prev))
      })
  }

  const triggerDelete = (id: string, fileIndex: number, key: string) => {
    if (!onDeleteFile) return
    setDeletingKey(key)
    Promise.resolve(onDeleteFile(id, fileIndex))
      .catch((error) => {
        console.error('Delete checklist file error:', error)
      })
      .finally(() => {
        setDeletingKey((prev) => (prev === key ? null : prev))
      })
  }

  return (
    <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-sm">
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập được đánh giá.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3 p-3">
            {items.map(item => {
              const taskChipClass =
                item.result === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : item.result === 'not_accurate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              
              return (
                <div
                  key={item.id}
                  className="rounded-xl border-2 border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Bài học</p>
                      <p className="text-sm font-bold text-gray-900 break-words mt-1">
                        {item.lesson || '—'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Thời gian</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {item.estimatedTime ? `${item.estimatedTime}'` : '—'} /{' '}
                        {item.actualTime ? `${item.actualTime}'` : '—'}
                      </p>
                    </div>
                  </div>
                  
                  {(() => {
                    const urls = item.assignmentUrls || parseFileUrls(item.assignmentUrl || (item as any).assignmentUrl)
                    return urls.length > 0 ? (
                      <div className="flex items-start gap-2">
                        <Folder className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">File bài tập</p>
                          <div className="flex flex-col gap-1 mt-1">
                            {urls.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline break-all"
                                title={url}
                              >
                                {urls.length > 1 ? `File ${idx + 1}` : 'Xem file'}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                  
                  <div className="flex items-start gap-2">
                    <Folder className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Bài làm học sinh</p>
                      <div className="mt-1 space-y-2">
                        {(() => {
                          const urls = item.uploadedFileUrls || parseFileUrls(item.uploadedFileUrl)
                          const isExpanded = expandedUploads[item.id] || false
                          const visibleUrls = isExpanded ? urls : urls.slice(0, MAX_VISIBLE_UPLOADS)
                          const remainingCount = urls.length - visibleUrls.length
                          const addKey = `${item.id}-mobile-add`
                          const isAddUploading = uploadingKey === addKey

                          return (
                            <>
                              {visibleUrls.map((url: string, idx: number) => {
                                const fileKey = `${item.id}-mobile-${idx}`
                                const deleteKey = `${item.id}-mobile-del-${idx}`
                                const isUploading = uploadingKey === fileKey
                                const isDeleting = deletingKey === deleteKey

                                const rawName = url.split('/').pop() || url
                                const fileName = rawName.split('?')[0] || rawName

                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 text-sm text-primary-600 hover:underline break-all"
                                      title={url}
                                    >
                                      {fileName}
                                    </a>
                                    <label
                                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                        isUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                      }`}
                                      title={isUploading ? 'Đang upload...' : 'Thay thế file'}
                                    >
                                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            markDirty(item.id)
                                            triggerUpload(item.id, e.target.files[0], fileKey, idx)
                                            e.target.value = ''
                                          }
                                        }}
                                        accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                      />
                                    </label>
                                    {onDeleteFile && (
                                      <button
                                        onClick={() => {
                                          if (!isDeleting) {
                                            markDirty(item.id)
                                            triggerDelete(item.id, idx, deleteKey)
                                          }
                                        }}
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-300 text-red-600 flex-shrink-0 ${
                                          isDeleting ? 'cursor-wait opacity-60' : 'hover:bg-red-50'
                                        }`}
                                        title={isDeleting ? 'Đang xóa...' : 'Xóa file'}
                                      >
                                        {isDeleting ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <X className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                              {remainingCount > 0 && (
                                <button
                                  type="button"
                                  className="text-[11px] text-primary-600 hover:underline"
                                  onClick={() =>
                                    setExpandedUploads(prev => ({
                                      ...prev,
                                      [item.id]: !isExpanded,
                                    }))
                                  }
                                >
                                  {isExpanded ? 'Thu gọn bớt file' : `Xem thêm ${remainingCount} file`}
                                </button>
                              )}
                              <div className="flex items-center gap-2">
                                <label
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-dashed border-primary-300 text-primary-600 text-xs ${
                                    isAddUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                  }`}
                                  title={isAddUploading ? 'Đang upload...' : 'Thêm file mới'}
                                >
                                  {isAddUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                  <span>Thêm file</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        markDirty(item.id)
                                        triggerUpload(item.id, e.target.files[0], addKey)
                                        e.target.value = ''
                                      }
                                    }}
                                    accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  />
                                </label>
                                {dirtyUploads[item.id] && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700"
                                    onClick={() =>
                                      setDirtyUploads(prev => {
                                        const next = { ...prev }
                                        delete next[item.id]
                                        return next
                                      })
                                    }
                                  >
                                    Lưu
                                  </button>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    const urls = item.solutionUrls || parseFileUrls(item.solutionUrl)
                    return urls.length > 0 ? (
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">File lời giải</p>
                          <div className="flex flex-col gap-1 mt-1">
                            {urls.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline break-all"
                                title={url}
                              >
                                {urls.length > 1 ? `File lời giải ${idx + 1}` : 'File lời giải'}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Trạng thái</p>
                      {onStatusChange ? (
                        <select
                          value={item.result}
                          onChange={(e) => onStatusChange(item.id, e.target.value as ChecklistDetailItem['result'])}
                          className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white ${taskChipClass}`}
                        >
                          <option value="not_completed" className="bg-red-100 text-red-700">Chưa xong</option>
                          <option value="not_accurate" className="bg-yellow-100 text-yellow-700">Đang làm</option>
                          <option value="completed" className="bg-green-100 text-green-700">Đã xong</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${taskChipClass}`}
                        >
                          {item.result === 'completed'
                            ? 'Đã xong'
                            : item.result === 'not_accurate'
                              ? 'Đang làm'
                              : 'Chưa xong'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
            <table className="w-full text-base min-w-[900px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Bài học
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Thời gian
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center justify-center gap-2">
                      <Folder className="w-4 h-4" />
                      File bài tập
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center justify-center gap-2">
                      <Folder className="w-4 h-4" />
                      Bài làm học sinh
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center justify-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      File lời giải
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      Trạng thái
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map(item => {
                  const taskChipClass =
                    item.result === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : item.result === 'not_accurate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {item.lesson || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-center">
                        <span className="whitespace-nowrap">
                          {item.estimatedTime ? `${item.estimatedTime}'` : '—'} /{' '}
                          {item.actualTime ? `${item.actualTime}'` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        {(() => {
                          const urls = item.assignmentUrls || parseFileUrls(item.assignmentUrl || (item as any).assignmentUrl)
                          return urls.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              {urls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-primary-600 hover:underline text-xs font-medium"
                                  title={url}
                                >
                                  {urls.length > 1 ? `File ${idx + 1}` : 'Xem file'}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const urls = item.uploadedFileUrls || parseFileUrls(item.uploadedFileUrl)
                          const isExpanded = expandedUploads[item.id] || false
                          const visibleUrls = isExpanded ? urls : urls.slice(0, MAX_VISIBLE_UPLOADS)
                          const remainingCount = urls.length - visibleUrls.length
                          const addKey = `${item.id}-desktop-add`
                          const isAddUploading = uploadingKey === addKey

                          return (
                            <div className="flex flex-col gap-2 items-center min-w-[220px]">
                              {visibleUrls.map((url: string, idx: number) => {
                                const fileKey = `${item.id}-desktop-${idx}`
                                const deleteKey = `${item.id}-desktop-del-${idx}`
                                const isUploading = uploadingKey === fileKey
                                const isDeleting = deletingKey === deleteKey

                                const rawName = url.split('/').pop() || url
                                const fileName = rawName.split('?')[0] || rawName

                                return (
                                  <div key={idx} className="flex justify-center w-full">
                                    <div className="inline-flex items-center gap-1">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary-600 hover:underline break-all text-left"
                                        title={url}
                                      >
                                        {fileName}
                                      </a>
                                      <label
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                          isUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                        }`}
                                        title={isUploading ? 'Đang upload...' : 'Thay thế file'}
                                      >
                                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                              markDirty(item.id)
                                              triggerUpload(item.id, e.target.files[0], fileKey, idx)
                                              e.target.value = ''
                                            }
                                          }}
                                          accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                        />
                                      </label>
                                      {onDeleteFile && (
                                        <button
                                          onClick={() => {
                                            if (!isDeleting) {
                                              markDirty(item.id)
                                              triggerDelete(item.id, idx, deleteKey)
                                            }
                                          }}
                                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-300 text-red-600 flex-shrink-0 ${
                                            isDeleting ? 'cursor-wait opacity-60' : 'hover:bg-red-50'
                                          }`}
                                          title={isDeleting ? 'Đang xóa...' : 'Xóa file'}
                                        >
                                          {isDeleting ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <X className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                              {remainingCount > 0 && (
                                <button
                                  type="button"
                                  className="text-[11px] text-primary-600 hover:underline"
                                  onClick={() =>
                                    setExpandedUploads((prev) => ({
                                      ...prev,
                                      [item.id]: !isExpanded,
                                    }))
                                  }
                                >
                                  {isExpanded ? 'Thu gọn bớt file' : `Xem thêm ${remainingCount} file`}
                                </button>
                              )}
                              <div className="flex items-center gap-2">
                                <label
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-dashed border-primary-300 text-primary-600 text-xs ${
                                    isAddUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                  }`}
                                  title={isAddUploading ? 'Đang upload...' : 'Thêm file mới'}
                                >
                                  {isAddUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                  <span>Thêm file</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        markDirty(item.id)
                                        triggerUpload(item.id, e.target.files[0], addKey)
                                        e.target.value = ''
                                      }
                                    }}
                                    accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  />
                                </label>
                                {dirtyUploads[item.id] && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700"
                                    onClick={() =>
                                      setDirtyUploads(prev => {
                                        const next = { ...prev }
                                        delete next[item.id]
                                        return next
                                      })
                                    }
                                  >
                                    Lưu
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const urls = item.solutionUrls || parseFileUrls(item.solutionUrl)
                          return urls.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              {urls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-primary-600 hover:underline text-xs font-medium"
                                  title={url}
                                >
                                  {urls.length > 1 ? `File ${idx + 1}` : 'File lời giải'}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {onStatusChange ? (
                          <select
                            value={item.result}
                            onChange={(e) => onStatusChange(item.id, e.target.value as ChecklistDetailItem['result'])}
                            className={`mx-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white ${taskChipClass}`}
                          >
                            <option value="not_completed" className="bg-red-100 text-red-700">Chưa xong</option>
                            <option value="not_accurate" className="bg-yellow-100 text-yellow-700">Đang làm</option>
                            <option value="completed" className="bg-green-100 text-green-700">Đã xong</option>
                          </select>
                        ) : (
                          <div className="flex justify-center">
                            <span
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${taskChipClass}`}
                            >
                              {item.result === 'completed'
                                ? 'Đã xong'
                                : item.result === 'not_accurate'
                                  ? 'Đang làm'
                                  : 'Chưa xong'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

