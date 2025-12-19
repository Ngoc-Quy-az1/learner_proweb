import { Check, AlertTriangle, X, Upload, Clipboard } from 'lucide-react'
import { processImageFile, isImageFile } from '../../utils/imageProcessor'

export interface ChecklistDetailItem {
  id: string
  lesson: string
  estimatedTime: number // minutes
  actualTime?: number // minutes
  result: 'completed' | 'not_accurate' | 'not_completed'
  attachment?: string
  qualityNote?: string
}

interface ChecklistDetailTableProps {
  items: ChecklistDetailItem[]
  onUpload?: (id: string, file: File) => void
  onTimeChange?: (id: string, actualTime: number) => void
  onResultChange?: (id: string, result: ChecklistDetailItem['result']) => void
  onQualityNoteChange?: (id: string, note: string) => void
}

export default function ChecklistDetailTable({
  items,
  onUpload,
  onTimeChange,
  onResultChange,
  onQualityNoteChange,
}: ChecklistDetailTableProps) {
  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    
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
    
    try {
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
            alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
            e.target.value = ''
            return
          }
        }
      } else {
        // Kiểm tra kích thước file không phải ảnh (15MB)
        const MAX_FILE_SIZE = 15 * 1024 * 1024
        if (file.size > MAX_FILE_SIZE) {
          alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
          e.target.value = ''
          return
        }
      }
      
      onUpload(id, processedFile)
    } catch (error) {
      console.error('File processing error:', error)
      alert('Không thể xử lý file. Vui lòng thử lại.')
    }
  }

  const getResultDisplay = (result: ChecklistDetailItem['result']) => {
    switch (result) {
      case 'completed':
        return {
          text: 'Hoàn thành',
          icon: <Check className="w-5 h-5 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        }
      case 'not_accurate':
        return {
          text: 'Chưa chính xác',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        }
      default:
        return {
          text: 'Chưa hoàn thành',
          icon: <X className="w-5 h-5 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        }
    }
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <Clipboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chưa có bài tập chi tiết</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6 pb-4 border-b-2 border-gray-200">
        <Clipboard className="w-5 h-5 text-primary-600" />
        <h3 className="text-xl font-bold text-gray-900">CHECKLIST BÀI TẬP CHI TIẾT</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-bold text-gray-900">Bài / Nhiệm vụ</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Thời gian dự kiến</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Thời gian thực tế</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Kết quả</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Upload bài làm</th>
              <th className="text-left py-3 px-4 font-bold text-gray-900">Nhận xét chất lượng</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const resultDisplay = getResultDisplay(item.result)
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === items.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-900">{item.lesson}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-gray-700 font-medium">{item.estimatedTime} phút</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {onTimeChange ? (
                      <input
                        type="number"
                        value={item.actualTime || ''}
                        onChange={(e) => onTimeChange(item.id, parseInt(e.target.value) || 0)}
                        placeholder="—"
                        className="w-20 text-center text-sm border-2 border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      />
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {item.actualTime ? `${item.actualTime} phút` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {onResultChange ? (
                      <select
                        value={item.result}
                        onChange={(e) => onResultChange(item.id, e.target.value as ChecklistDetailItem['result'])}
                        className={`text-sm ${resultDisplay.bgColor} border-2 ${resultDisplay.borderColor} rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all cursor-pointer`}
                      >
                        <option value="completed">Hoàn thành</option>
                        <option value="not_accurate">Chưa chính xác</option>
                        <option value="not_completed">Chưa hoàn thành</option>
                      </select>
                    ) : (
                      <div className={`inline-flex items-center space-x-2 ${resultDisplay.bgColor} border ${resultDisplay.borderColor} rounded-lg px-3 py-1.5`}>
                        {resultDisplay.icon}
                        <span className="text-sm font-medium text-gray-700">{resultDisplay.text}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {onUpload ? (
                      <label className="inline-flex items-center space-x-2 cursor-pointer text-primary-600 hover:text-primary-700 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(item.id, e)}
                        />
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Upload ảnh bài làm</span>
                      </label>
                    ) : item.attachment ? (
                      <div className="inline-flex items-center space-x-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Đã tải</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {onQualityNoteChange ? (
                      <input
                        type="text"
                        value={item.qualityNote || ''}
                        onChange={(e) => onQualityNoteChange(item.id, e.target.value)}
                        placeholder="—"
                        className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      />
                    ) : (
                      <span className="text-gray-600">{item.qualityNote || '—'}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}















