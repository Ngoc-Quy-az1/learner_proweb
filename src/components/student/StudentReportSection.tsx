import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface ScheduleReport {
  id: string
  subjectCode: string
  startTime: string
  tutor: string
  reportURL: string
}

interface StudentReportSectionProps {
  title?: string
  scheduleId: string
  report: ScheduleReport | null
  loading?: boolean
  getSubjectDisplayName?: (code?: string, fallback?: string) => string
  onDownload?: (scheduleId: string) => void
  alwaysExpanded?: boolean
}

const StudentReportSection: React.FC<StudentReportSectionProps> = ({
  title = 'Báo cáo buổi học',
  scheduleId,
  report,
  loading = false,
  getSubjectDisplayName = (code) => code || '—',
  onDownload,
  alwaysExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(alwaysExpanded || true)

  const handleDownload = () => {
    if (report?.reportURL && onDownload) {
      onDownload(scheduleId)
    } else if (report?.reportURL) {
      // Fallback: direct download
      const link = document.createElement('a')
      link.href = report.reportURL
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        {alwaysExpanded ? (
          <h4 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h4>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <h4 className="text-inherit font-inherit">{title}</h4>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {isExpanded && (
        <>
          {loading && (
            <div className="mt-4 text-sm text-gray-500">Đang tải báo cáo...</div>
          )}
          {!loading && !report && (
            <div className="mt-4 text-sm text-gray-500 italic">
              Chưa có báo cáo cho buổi học này.
            </div>
          )}
          {!loading && report && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                    Môn học
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {getSubjectDisplayName(report.subjectCode, report.subjectCode)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                    Thời gian
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {report.startTime
                      ? format(new Date(report.startTime), 'dd/MM/yyyy HH:mm')
                      : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                    Gia sư
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {report.tutor || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                    File báo cáo
                  </p>
                  {report.reportURL ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={report.reportURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Mở báo cáo
                      </a>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
                      >
                        <Download className="w-4 h-4" />
                        Tải xuống
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa có file báo cáo.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StudentReportSection

