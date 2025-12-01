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
                  
                  {(item.assignmentFileName || (item as any).assignmentUrl) && (
                    <div className="flex items-start gap-2">
                      <Folder className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">File bài tập</p>
                        <a
                          href={(item as any).assignmentUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline break-all block mt-1"
                          title={(item as any).assignmentUrl || item.assignmentFileName}
                        >
                          {item.assignmentFileName || 'Xem file'}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Folder className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Bài làm học sinh</p>
                      <div className="mt-1">
                        {item.uploadedFileName || item.uploadedFileUrl ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={item.uploadedFileUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:underline break-all flex-1 min-w-0"
                              title={item.uploadedFileUrl || item.uploadedFileName}
                            >
                              {item.uploadedFileName || 'Bài làm học sinh'}
                            </a>
                            <label
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 cursor-pointer hover:bg-primary-50"
                              title="Cập nhật bài làm"
                            >
                              <Upload className="w-4 h-4" />
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
                      </div>
                    </div>
                  </div>
                  
                  {item.solutionUrl && (
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">File lời giải</p>
                        <a
                          href={item.solutionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline break-all block mt-1"
                          title={item.solutionUrl}
                        >
                          File lời giải
                        </a>
                      </div>
                    </div>
                  )}
                  
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
          </div>
        </>
      )}
    </div>
  )
}

