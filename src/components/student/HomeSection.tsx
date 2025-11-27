import { useState } from 'react'
import { UserCircle, Play, Target, Calendar, ChevronRight, Clock, Copy, MessageSquare, ChevronDown, ChevronUp, Star, Eye, Download, ExternalLink, BookOpen } from 'lucide-react'
import MaterialUploadSection from './MaterialUploadSection'
import type { ScheduleItem } from '../dashboard'
import type { TutorInfo, DailyReport, ChecklistWithDate, StudentHighlightCard } from './types'

interface HomeSectionProps {
  schedules: ScheduleItem[]
  todaySchedules: ScheduleItem[]
  checklistItems: ChecklistWithDate[]
  todayChecklist: ChecklistWithDate[]
  todayReports: DailyReport[]
  tutorInfoMap: Record<string, TutorInfo>
  progressPercentage: number
  completedCount: number
  totalCount: number
  studentHighlightCards: StudentHighlightCard[]
  uploadScheduleOptions: ScheduleItem[]
  selectedUploadScheduleId: string | null
  onScheduleChange: (section: string) => void
  onUploadScheduleChange: (scheduleId: string) => void
  onUploadSuccess: () => void
  onJoinClass: (scheduleId: string) => void
  onChecklistClick: () => void
  onSubjectSelect: (subject: string) => void
  getScheduleStatus: (schedule: ScheduleItem) => 'ongoing' | 'upcoming' | 'completed'
  getSubjectColor: (subject: string) => { bg: string; text: string }
  onExportCombinedReport: () => void
  onOpenReportPreview: (report: DailyReport) => void
  scheduleFetchTrigger: number
}

export default function HomeSection({
  schedules: _schedules,
  todaySchedules,
  checklistItems: _checklistItems,
  todayChecklist,
  todayReports,
  tutorInfoMap,
  progressPercentage,
  completedCount,
  totalCount,
  studentHighlightCards,
  uploadScheduleOptions,
  selectedUploadScheduleId,
  onScheduleChange,
  onUploadScheduleChange,
  onUploadSuccess,
  onJoinClass,
  onChecklistClick,
  onSubjectSelect,
  getScheduleStatus,
  getSubjectColor,
  onExportCombinedReport,
  onOpenReportPreview,
  scheduleFetchTrigger: _scheduleFetchTrigger,
}: HomeSectionProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null)
  const [isDetailedReviewExpanded, setIsDetailedReviewExpanded] = useState(false)
  const [expandedChecklistCard, setExpandedChecklistCard] = useState<string | null>(null)

  // Group today's checklist by assignment (lesson + subject)
  const renderTodayChecklistGroups = () => {
    if (todayChecklist.length === 0) {
      return <p className="text-sm text-gray-500">Chưa có checklist nào cho hôm nay.</p>
    }

    const grouped = todayChecklist.reduce<
      Record<string, { lesson: string; subject: string; items: ChecklistWithDate[] }>
    >((acc, item) => {
      const lessonName = item.lesson || 'Checklist'
      const subjectName = item.subject || 'Chung'
      const key = `${lessonName}-${subjectName}`
      if (!acc[key]) {
        acc[key] = { lesson: lessonName, subject: subjectName, items: [] }
      }
      acc[key].items.push(item)
      return acc
    }, {})

    const groups = Object.entries(grouped)

    const getStatusStyle = (status: ChecklistWithDate['status']) => {
      switch (status) {
        case 'done':
          return 'bg-green-50 text-green-700 border-green-200'
        case 'in_progress':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200'
        default:
          return 'bg-gray-50 text-gray-600 border-gray-200'
      }
    }

    return (
      <div className="space-y-3">
        {groups.map(([key, group]) => {
          const completed = group.items.filter((item) => item.status === 'done').length
          const total = group.items.length
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
          const isExpanded = expandedChecklistCard === key

          return (
            <div key={key} className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedChecklistCard(isExpanded ? null : key)}
              >
                <div>
                  <p className="text-base font-bold text-gray-900">{group.lesson}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{group.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {completed}/{total} nhiệm vụ · {percentage}% hoàn thành
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-primary-600">Chi tiết</span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nhiệm vụ</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ghi chú</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {group.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <p className="font-semibold text-xs sm:text-sm text-gray-900">{item.task}</p>
                                {item.lesson && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">Bài học: {item.lesson}</p>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {item.note ? (
                                  <p className="text-xs text-gray-600">{item.note}</p>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full border ${getStatusStyle(item.status)}`}
                                >
                                  {item.status === 'done'
                                    ? 'Đã xong'
                                    : item.status === 'in_progress'
                                      ? 'Đang làm'
                                      : 'Chưa làm'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <BookOpen className="w-4 h-4 text-primary-600" />
                      <span>Nhấn "Xem đầy đủ" để cập nhật trạng thái từng nhiệm vụ.</span>
                    </div>
                    <button
                      onClick={() => {
                        onSubjectSelect(group.subject)
                        onChecklistClick()
                      }}
                      className="px-4 py-2 text-xs font-semibold text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
                    >
                      Xem đầy đủ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3 lg:gap-4 overflow-hidden">
      {/* Main Layout - 2 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 min-w-0">
        {/* Left Column - Profile & Quick Actions (Fixed, No Scroll) */}
        <div className="lg:col-span-1 flex-shrink-0 h-full overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Profile Card */}
            <div className="card hover:shadow-xl transition-shadow duration-300 flex-1 flex flex-col">
              <div className="text-center mb-4 lg:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg hover:scale-105 transition-transform duration-300">
                  <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">Nguyễn Văn A</h3>
                <p className="text-xs text-gray-600">student@skillar.com</p>
              </div>

              {/* Progress Stats */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100 shadow-inner">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{progressPercentage}%</div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Hoàn thành hôm nay</p>
                  <div className="w-full h-2 sm:h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    if (todaySchedules.length > 0 && todaySchedules[0].meetLink) {
                      onJoinClass(todaySchedules[0].id)
                    }
                  }}
                  className="w-full card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left min-h-[100px] sm:min-h-[132px]"
                >
                  <div className="flex flex-col items-center justify-center py-3 sm:py-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Vào lớp học</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Tham gia buổi học trực tuyến</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (todayChecklist.length > 0) {
                      onSubjectSelect(todayChecklist[0].subject)
                    }
                    onChecklistClick()
                  }}
                  className="w-full card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left min-h-[100px] sm:min-h-[132px]"
                >
                  <div className="flex flex-col items-center justify-center py-3 sm:py-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Xem checklist</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Theo dõi tiến độ học tập</p>
                  </div>
                </button>
              </div>

              {/* Student highlight stats */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
                {studentHighlightCards.map((card) => (
                  <div key={card.id} className="border border-gray-100 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-3 sm:py-4 bg-gradient-to-br from-white to-gray-50 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 to-transparent pointer-events-none"></div>
                    <div className="relative">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-1">{card.label}</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{card.value}</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">{card.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content (Scrollable) */}
        <div className="lg:col-span-2 h-full overflow-y-auto space-y-3 sm:space-y-4">
          {/* Material Upload Section */}
          <MaterialUploadSection
            scheduleOptions={uploadScheduleOptions.map(s => ({
              id: s.id,
              subject: s.subject || 'Chung',
              date: s.date,
            }))}
            selectedScheduleId={selectedUploadScheduleId}
            onScheduleChange={onUploadScheduleChange}
            onUploadSuccess={onUploadSuccess}
          />

          {/* Today's Schedule */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Lịch học hôm nay</h2>
                <p className="text-sm text-gray-600">{todaySchedules.length} buổi học</p>
              </div>
              <button
                onClick={() => onScheduleChange('schedule')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Không có lịch học hôm nay</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => {
                  const status = getScheduleStatus(schedule)
                  const statusConfig = {
                    ongoing: { label: 'Đang diễn ra', className: 'bg-green-100 text-green-700' },
                    upcoming: { label: 'Sắp diễn ra', className: 'bg-yellow-100 text-yellow-700' },
                    completed: { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-600' },
                  }[status]
                  const tutorProfile = schedule.tutorId ? tutorInfoMap[schedule.tutorId] : undefined
                  const displayTutorName = tutorProfile?.name || schedule.tutor
                  const canViewTutorDetail = Boolean(schedule.tutorId)

                  return (
                    <div
                      key={schedule.id}
                      onClick={() => {
                        if (schedule.tutorId) {
                          setSelectedTutorSchedule(schedule.id)
                        }
                      }}
                      className={`border-2 border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50 ${
                        canViewTutorDetail ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                schedule.subject === 'Toán'
                                  ? 'bg-blue-500 text-white'
                                  : schedule.subject === 'Hóa'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-500 text-white'
                              }`}
                            >
                              {schedule.subject}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{schedule.time}</span>
                          </div>
                          {displayTutorName ? (
                            <p className="text-sm text-gray-600">
                              Tutor: <span className="font-semibold text-gray-900">{displayTutorName}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Tutor sẽ được cập nhật sớm</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center gap-2">
                            {schedule.meetLink && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onJoinClass(schedule.id)
                                }}
                                className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                              >
                                Vào lớp
                              </button>
                            )}
                            {statusConfig && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                                {statusConfig.label}
                              </span>
                            )}
                          </div>
                          {schedule.meetLink && (
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 group">
                              <input
                                type="text"
                                value={schedule.meetLink}
                                readOnly
                                className="text-xs text-gray-600 bg-transparent border-none outline-none w-32 truncate"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(schedule.meetLink || '')
                                  setCopiedLink(schedule.id)
                                  setTimeout(() => setCopiedLink(null), 2000)
                                }}
                                className="text-gray-500 hover:text-primary-600 transition-colors"
                                title="Copy link"
                              >
                                {copiedLink === schedule.id ? (
                                  <Clock className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {!canViewTutorDetail && (
                        <p className="text-[11px] text-gray-400 mt-2">Tutor đang được hệ thống cập nhật.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tutor Detail Modal */}
          {selectedTutorSchedule && (() => {
            const schedule = todaySchedules.find((s) => s.id === selectedTutorSchedule)
            if (!schedule || !schedule.tutorId) return null
            const tutorProfile = tutorInfoMap[schedule.tutorId]
            const displayTutorName = tutorProfile?.name || schedule.tutor || 'Tutor đang được cập nhật'
            const tutorInitial = displayTutorName.charAt(0)?.toUpperCase() || 'T'

            return (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedTutorSchedule(null)}
              >
                <div
                  className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between z-10">
                    <h2 className="text-3xl font-bold text-gray-900">Thông tin chi tiết Tutor</h2>
                    <button
                      onClick={() => setSelectedTutorSchedule(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="border-b border-gray-200 pb-2"></div>

                    {tutorProfile ? (
                      <>
                        <div className="flex flex-col lg:flex-row items-start gap-6 border border-gray-100 rounded-3xl bg-gray-50 p-6">
                          <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-primary-100 shadow-lg flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-4xl font-bold flex items-center justify-center">
                            {tutorProfile.avatarUrl ? (
                              <img src={tutorProfile.avatarUrl} alt={displayTutorName} className="w-full h-full object-cover" />
                            ) : (
                              tutorInitial
                            )}
                          </div>
                          <div className="flex-1 space-y-4">
                            <h3 className="text-4xl font-extrabold text-gray-900">{displayTutorName}</h3>
                            <p className="text-lg text-gray-500">{tutorProfile.currentLevel || 'Tutor LearnerPro'}</p>
                            {schedule.note && (
                              <p className="text-base text-gray-600">
                                <span className="font-semibold text-gray-800">Ghi chú buổi học:</span> {schedule.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="p-5 border rounded-2xl bg-white shadow-sm">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                            <p className="text-lg font-semibold text-gray-900">{tutorProfile.email || 'Chưa cập nhật'}</p>
                          </div>
                          <div className="p-5 border rounded-2xl bg-white shadow-sm">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</p>
                            <p className="text-lg font-semibold text-gray-900">{tutorProfile.phone || 'Chưa cập nhật'}</p>
                          </div>
                          <div className="p-5 border rounded-2xl bg-white shadow-sm">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</p>
                            <p className="text-lg font-semibold text-gray-900">{tutorProfile.address || 'Chưa cập nhật'}</p>
                          </div>
                          <div className="p-5 border rounded-2xl bg-white shadow-sm">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Môn phụ trách</p>
                            <p className="text-lg font-semibold text-gray-900">{schedule.subject || 'Đang cập nhật'}</p>
                          </div>
                          <div className="p-5 border rounded-2xl bg-white shadow-sm md:col-span-2">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">CV / Hồ sơ</p>
                            {tutorProfile.cvUrl ? (
                              <a
                                href={tutorProfile.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-lg font-semibold text-primary-600 hover:text-primary-700"
                              >
                                Xem CV
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            ) : (
                              <p className="text-lg font-semibold text-gray-900">Tutor chưa cập nhật CV</p>
                            )}
                          </div>
                        </div>

                        <div className="p-5 border border-gray-100 rounded-3xl bg-gray-50">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em] mb-3">Giới thiệu</p>
                          <p className="text-lg text-gray-700 leading-relaxed">
                            {tutorProfile.moreInfo || 'Tutor vẫn chưa cập nhật phần giới thiệu chi tiết.'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 border border-dashed border-gray-300 rounded-2xl bg-gray-50 text-sm text-gray-600">
                        Hệ thống đang cập nhật thông tin chi tiết của tutor này. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ nếu cần thêm thông tin.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Today's Checklist by Subject */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Checklist hôm nay</h2>
                <p className="text-sm text-gray-600">{completedCount}/{totalCount} hoàn thành</p>
              </div>
              <button
                onClick={() => onScheduleChange('checklist')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {renderTodayChecklistGroups()}
          </div>

          {/* Detailed Review */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Đánh giá chi tiết</h2>
                </div>
                <button
                  onClick={() => setIsDetailedReviewExpanded(!isDetailedReviewExpanded)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isDetailedReviewExpanded ? 'Thu gọn' : 'Mở rộng'}
                  </span>
                  {isDetailedReviewExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isDetailedReviewExpanded && todayReports.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {todayReports[0].criteria.map((criteria) => (
                    <div
                      key={criteria.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 mb-1">{criteria.metric}</p>
                          <p className="text-sm text-gray-600">{criteria.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`${criteria.id}-preview-star-${star}`}
                              className={`w-5 h-5 ${star <= criteria.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                          <span className="text-lg font-bold text-gray-900 ml-2">{criteria.rating}/5</span>
                        </div>
                      </div>
                      <div className="bg-primary-50 text-primary-800 text-sm font-semibold px-3 py-2 rounded-lg">
                        {criteria.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* General Review */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Đánh giá chung</h2>
              </div>
              <div className="space-y-4">
                {todayReports.map((report) => {
                  const subjectColor = getSubjectColor(report.subject)
                  return (
                    <div key={report.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1.5 rounded-lg text-base font-bold ${subjectColor.bg} ${subjectColor.text}`}>
                          {report.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <img 
                            src="https://www.paratime.vn/wp-content/uploads/2020/02/TIME-Studio-headshot-3-elements.jpg" 
                            alt={report.tutor}
                            className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-gray-200"
                          />
                          <p className="text-base font-semibold text-gray-700">{report.tutor}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 leading-relaxed">
                        {report.generalComment || report.summary}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Export Report */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Download className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Xuất báo cáo</h2>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      Báo cáo tổng hợp tất cả môn học hôm nay
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Bao gồm: {todayReports.map(r => r.subject).join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Xem báo cáo demo trước khi tải xuống.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (todayReports.length > 0) {
                          onOpenReportPreview(todayReports[0])
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white text-base font-bold hover:bg-primary-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      Xem báo cáo mẫu
                    </button>
                    <button
                      onClick={onExportCombinedReport}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-500 text-primary-600 text-base font-bold hover:bg-primary-50 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Tải báo cáo tổng hợp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

