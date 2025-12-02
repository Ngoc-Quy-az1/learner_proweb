import { useState } from 'react'
import { FileText, Download, Upload } from 'lucide-react'

export interface HomeworkDetailItem {
  id: string
  task: string
  estimatedTime: number // phút
  actualTime?: number // phút
  difficulty: 'easy' | 'medium' | 'hard' | 'advanced'
  result: 'completed' | 'not_completed'
  comment?: string
  solutionType?: 'text' | 'file' | 'image'
  solutionText?: string
  solutionFileName?: string
  solutionUrl?: string
  solutionPreview?: string
  uploadedFileName?: string
  assignmentFileName?: string
  assignmentUrl?: string
  assignmentUrls?: string[]
  solutionUrls?: string[]
  studentSolutionFileUrl?: string
  studentSolutionFileUrls?: string[]
  deadline?: string
  createdAt?: string
}

const homeworkResultConfig: Record<
  HomeworkDetailItem['result'],
  { label: string; className: string }
> = {
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  not_completed: { label: 'Chưa hoàn thành', className: 'bg-red-100 text-red-800' },
}

interface HomeworkDetailTableProps {
  items: HomeworkDetailItem[]
  onUpload: (id: string, file: File) => void
}

export default function HomeworkDetailTable({
  items,
  onUpload,
}: HomeworkDetailTableProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})

  const handleFileChange = (id: string, file?: File) => {
    if (!file) return
    setUploadedFiles(prev => ({ ...prev, [id]: file.name }))
    onUpload(id, file)
  }

  const getDifficultyDisplay = (difficulty: HomeworkDetailItem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return { text: 'Dễ', bgColor: 'bg-green-100', textColor: 'text-green-700' }
      case 'medium':
        return { text: 'Trung bình', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' }
      case 'hard':
        return { text: 'Khó', bgColor: 'bg-orange-100', textColor: 'text-orange-700' }
      default:
        return { text: 'Khá', bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
    }
  }

  const renderResultBadge = (result: HomeworkDetailItem['result']) => {
    const config = homeworkResultConfig[result]
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập.</p>
      ) : (
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-blue-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian ước lượng</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">File bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian thực tế</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Upload nộp bài</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Lời giải</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Mức độ</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Kết quả</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Nhận xét</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => {
                const difficultyDisplay = getDifficultyDisplay(item.difficulty)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-2 font-semibold text-gray-900 min-w-[120px]">{item.task}</td>
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
                    <td className="px-2 sm:px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                      {item.actualTime ? `${item.actualTime} phút` : '—'}
                    </td>
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
                      {!item.solutionText && !item.solutionUrl && !item.solutionFileName && (
                        <span className="text-xs text-gray-400">Chưa có lời giải</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      <span className={`${difficultyDisplay.bgColor} ${difficultyDisplay.textColor} px-2 py-0.5 rounded text-xs font-semibold`}>
                        {difficultyDisplay.text}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{renderResultBadge(item.result)}</td>
                    <td className="px-2 sm:px-3 py-2 text-gray-500 min-w-[100px]">{item.comment || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

