import { Upload, Layers, Clock, Folder, Lightbulb } from 'lucide-react'

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
  uploadedFileUrl?: string
  assignmentFileName?: string
}

interface ChecklistDetailTableProps {
  items: ChecklistDetailItem[]
  onUpload: (id: string, file: File) => void
  onStatusChange?: (id: string, status: ChecklistDetailItem['result']) => void
}

export default function ChecklistDetailTable({
  items,
  onUpload,
  onStatusChange,
}: ChecklistDetailTableProps) {
  const handleFileChange = (id: string, file?: File) => {
    if (!file) return
    onUpload(id, file)
  }

  return (
    <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-sm scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập được đánh giá.</p>
        </div>
      ) : (
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
                  <td className="px-4 py-3 text-center">
                    {item.assignmentFileName || (item as any).assignmentUrl ? (
                      <a
                        href={(item as any).assignmentUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-primary-600 hover:underline text-xs font-medium"
                        title={(item as any).assignmentUrl || item.assignmentFileName}
                      >
                        Xem file
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.uploadedFileName || item.uploadedFileUrl ? (
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={item.uploadedFileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-primary-600 hover:underline text-xs font-medium"
                          title={item.uploadedFileUrl || item.uploadedFileName}
                        >
                          {item.uploadedFileName || 'Bài làm học sinh'}
                        </a>
                        <label
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 cursor-pointer hover:bg-primary-50"
                          title="Cập nhật bài làm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                          />
                        </label>
                      </div>
                    ) : (
                      <label
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-primary-300 text-primary-600 text-xs cursor-pointer hover:bg-primary-50"
                        title="Upload bài làm"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        Upload bài làm
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                          accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.solutionUrl ? (
                      <a
                        href={item.solutionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-primary-600 hover:underline text-xs font-medium"
                        title={item.solutionUrl}
                      >
                        File lời giải
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
      )}
    </div>
  )
}

