import { useState } from 'react'
import { FileText, Download, Upload } from 'lucide-react'

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
  solutionPreview?: string
  uploadedFileName?: string
  assignmentFileName?: string
}

const checklistResultConfig: Record<
  ChecklistDetailItem['result'],
  { label: string; className: string }
> = {
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  not_accurate: { label: 'Chưa chính xác', className: 'bg-yellow-100 text-yellow-800' },
  not_completed: { label: 'Chưa xong', className: 'bg-red-100 text-red-800' },
}

interface ChecklistDetailTableProps {
  items: ChecklistDetailItem[]
  onUpload: (id: string, file: File) => void
  onUploadSolution: (id: string, file: File) => void
  canUploadSolution?: boolean
}

export default function ChecklistDetailTable({
  items,
  onUpload,
  onUploadSolution,
  canUploadSolution = true,
}: ChecklistDetailTableProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const [solutionUploads, setSolutionUploads] = useState<Record<string, string>>({})

  const handleFileChange = (id: string, file?: File) => {
    if (!file) return
    setUploadedFiles(prev => ({ ...prev, [id]: file.name }))
    onUpload(id, file)
  }

  const handleSolutionChange = (id: string, file?: File) => {
    if (!file) return
    setSolutionUploads(prev => ({ ...prev, [id]: file.name }))
    onUploadSolution(id, file)
  }

  const renderResultBadge = (result: ChecklistDetailItem['result']) => {
    const config = checklistResultConfig[result]
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập được đánh giá.</p>
      ) : (
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-blue-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian ước lượng</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">File bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian thực tế</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Upload bài làm</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Lời giải</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Kết quả</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Nhận xét</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-2 font-semibold text-gray-900 min-w-[120px]">{item.lesson}</td>
                  <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap">{item.estimatedTime} phút</td>
                  <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                    {item.assignmentFileName ? (
                      <div className="flex items-center gap-1 sm:gap-2 text-blue-600">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.assignmentFileName}</span>
                        <Download className="w-3 h-3 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-gray-900 font-medium whitespace-nowrap">{item.actualTime} phút</td>
                  <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                    {item.uploadedFileName ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.uploadedFileName}</span>
                          <Download className="w-3 h-3 cursor-pointer hover:text-green-700 flex-shrink-0" />
                        </div>
                        <label className="inline-flex items-center gap-1 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <Upload className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">Cập nhật</span>
                        </label>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1 sm:gap-2 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{uploadedFiles[item.id] || 'Tải bài làm'}</span>
                      </label>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-gray-600 space-y-1 sm:space-y-2 min-w-[150px]">
                    {item.solutionText && (
                      <p className="text-xs sm:text-sm text-gray-700 leading-snug">{item.solutionText}</p>
                    )}
                    {item.solutionUrl ? (
                      <div className="flex items-center gap-1 sm:gap-2 text-primary-600">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <a
                          href={item.solutionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold hover:underline truncate max-w-[120px] sm:max-w-none"
                          title={item.solutionUrl}
                        >
                          {item.solutionFileName || 'Xem lời giải'}
                        </a>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer hover:text-primary-700 flex-shrink-0" 
                          onClick={(e) => {
                            e.preventDefault()
                            const link = document.createElement('a')
                            link.href = item.solutionUrl!
                            link.download = item.solutionFileName || 'solution'
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        />
                      </div>
                    ) : item.solutionFileName && (
                      <div className="text-xs font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{item.solutionFileName}</span>
                      </div>
                    )}
                    {item.solutionType === 'image' && item.solutionPreview && (
                      <img
                        src={item.solutionPreview}
                        alt="Solution preview"
                        className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg border"
                      />
                    )}
                    {canUploadSolution && (
                      <label className="inline-flex items-center gap-1 sm:gap-2 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleSolutionChange(item.id, e.target.files?.[0])}
                        />
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{solutionUploads[item.id] || item.solutionFileName ? 'Cập nhật lời giải' : 'Thêm lời giải'}</span>
                      </label>
                    )}
                    {!canUploadSolution && !item.solutionUrl && !item.solutionFileName && !item.solutionText && (
                      <span className="text-xs text-gray-400 italic">Chưa có lời giải</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{renderResultBadge(item.result)}</td>
                  <td className="px-2 sm:px-3 py-2 text-gray-500 min-w-[100px]">{item.qualityNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

