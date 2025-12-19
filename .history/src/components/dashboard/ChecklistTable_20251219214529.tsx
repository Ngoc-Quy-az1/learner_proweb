import { useState } from 'react'
import { Check, Clock, X, Upload, FileText, Plus, Edit, Trash2, BookOpen } from 'lucide-react'

export interface ChecklistItem {
  id: string
  subject: string
  lesson: string
  task: string
  status: 'not_done' | 'in_progress' | 'done'
  note?: string
  attachment?: string
}

interface ChecklistTableProps {
  items: ChecklistItem[]
  editable?: boolean
  onStatusChange?: (id: string, status: ChecklistItem['status']) => void
  onNoteChange?: (id: string, note: string) => void
  onUpload?: (id: string, file: File) => void
  onAdd?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ChecklistTable({
  items,
  editable = false,
  onStatusChange,
  onNoteChange,
  onUpload,
  onAdd,
  onEdit,
  onDelete,
}: ChecklistTableProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      setUploadingId(id)
      onUpload(id, file)
      setTimeout(() => setUploadingId(null), 1000)
    }
  }

  const getStatusDisplay = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'done':
        return {
          text: 'Đã xong',
          icon: <Check className="w-4 h-4 text-green-600" />,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        }
      case 'in_progress':
        return {
          text: 'Đang làm',
          icon: <Clock className="w-4 h-4 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        }
      default:
        return {
          text: 'Chưa xong',
          icon: <X className="w-4 h-4 text-gray-400" />,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        }
    }
  }

  const getSubjectBadgeColor = (subject: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Toán': { bg: 'bg-blue-500', text: 'text-white' },
      'Lý': { bg: 'bg-purple-500', text: 'text-white' },
      'Hóa': { bg: 'bg-green-500', text: 'text-white' },
      'Anh': { bg: 'bg-yellow-500', text: 'text-white' },
      'Văn': { bg: 'bg-red-500', text: 'text-white' },
    }
    return colors[subject] || { bg: 'bg-gray-500', text: 'text-white' }
  }

  // Group items by subject
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = []
    }
    acc[item.subject].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  if (items.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Chưa có bài học nào trong checklist</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([subject, subjectItems]) => {
        const badgeColor = getSubjectBadgeColor(subject)
        return (
          <div key={subject} className="card">
            {/* Subject Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`${badgeColor.bg} ${badgeColor.text} p-2 rounded-lg`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{subject} học</h3>
              </div>
              {editable && onAdd && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onAdd}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Thêm bài mới</span>
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Bài học</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Nhiệm vụ</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Nhận xét</th>
                    {editable && (onEdit || onDelete) && (
                      <th className="text-center py-3 px-4 font-bold text-gray-900">Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {subjectItems.map((item, index) => {
                    const statusDisplay = getStatusDisplay(item.status)
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index === subjectItems.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900">{item.lesson}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{item.task}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {editable && onStatusChange ? (
                            <select
                              value={item.status}
                              onChange={(e) => onStatusChange(item.id, e.target.value as ChecklistItem['status'])}
                              className={`text-sm ${statusDisplay.bgColor} ${statusDisplay.textColor} border-2 ${statusDisplay.borderColor} rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all cursor-pointer`}
                            >
                              <option value="not_done">Chưa xong</option>
                              <option value="in_progress">Đang làm</option>
                              <option value="done">Đã xong</option>
                            </select>
                          ) : (
                            <div className={`inline-flex items-center space-x-2 ${statusDisplay.bgColor} ${statusDisplay.textColor} border ${statusDisplay.borderColor} rounded-lg px-3 py-1.5`}>
                              {statusDisplay.icon}
                              <span className="text-sm font-medium">{statusDisplay.text}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editable && onNoteChange ? (
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => onNoteChange(item.id, e.target.value)}
                              placeholder="—"
                              className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                          ) : (
                            <span className="text-gray-600">{item.note || '—'}</span>
                          )}
                        </td>
                        {editable && (onEdit || onDelete) && (
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(item.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(item.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Upload section for each subject if needed */}
            {onUpload && subjectItems.some(item => !item.attachment) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {subjectItems
                    .filter(item => !item.attachment)
                    .map((item) => (
                      <label
                        key={item.id}
                        className="inline-flex items-center space-x-2 cursor-pointer bg-gradient-to-r from-primary-50 to-blue-50 hover:from-primary-100 hover:to-blue-100 px-4 py-2 rounded-lg border border-primary-200 transition-all"
                      >
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            // Kiểm tra kích thước file (15MB)
                            const MAX_FILE_SIZE = 15 * 1024 * 1024
                            if (file.size > MAX_FILE_SIZE) {
                              alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
                              e.target.value = ''
                              return
                            }
                            
                            // Kiểm tra định dạng file
                            const allowedTypes = [
                              'application/pdf',
                              'image/jpeg',
                              'image/jpg',
                              'image/png',
                              'image/gif',
                              'image/webp'
                            ]
                            const fileExtension = file.name.split('.').pop()?.toLowerCase()
                            const isValidType = allowedTypes.includes(file.type) || 
                              ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
                            
                            if (!isValidType) {
                              alert(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF hoặc hình ảnh.`)
                              e.target.value = ''
                              return
                            }
                            
                            handleFileUpload(item.id, e)
                          }}
                          disabled={uploadingId === item.id}
                        />
                        <Upload className={`w-4 h-4 ${uploadingId === item.id ? 'text-primary-400' : 'text-primary-600'}`} />
                        <span className={`text-sm font-medium ${uploadingId === item.id ? 'text-primary-400' : 'text-primary-700'}`}>
                          {uploadingId === item.id ? 'Đang tải...' : `Upload ${item.lesson}`}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
