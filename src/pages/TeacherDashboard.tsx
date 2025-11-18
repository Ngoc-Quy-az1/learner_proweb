import { useState } from 'react'
import Layout from '../components/Layout'
import { Bell, Users, Calendar, FileText, MessageSquare, CheckCircle, Video, Clock } from 'lucide-react'

interface SupportRequest {
  id: string
  studentName: string
  subject: string
  tutorName: string
  reason: string
  date: string
  status: 'pending' | 'in_progress' | 'completed'
}

export default function TeacherDashboard() {
  const [supportRequests] = useState<SupportRequest[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn A',
      subject: 'Toán',
      tutorName: 'Tutor B',
      reason: 'Không hiểu bài Hệ phương trình',
      date: '12/11/2024',
      status: 'pending',
    },
    {
      id: '2',
      studentName: 'Trần Thị B',
      subject: 'Lý',
      tutorName: 'Tutor C',
      reason: 'Cần hỗ trợ phần Điện học',
      date: '11/11/2024',
      status: 'in_progress',
    },
  ])

  const handleAcceptRequest = (id: string) => {
    console.log('Accept support request:', id)
    alert('Đã chấp nhận yêu cầu hỗ trợ. Vui lòng liên hệ phụ huynh qua Zalo.')
  }

  const handleCompleteRequest = (id: string) => {
    console.log('Complete support request:', id)
    alert('Đã hoàn thành hỗ trợ. Báo cáo đã được gửi.')
  }

  return (
    <Layout title="Dashboard Giáo Viên Bộ Môn">
      <div className="h-full overflow-y-auto space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Yêu cầu mới</p>
              <p className="text-2xl font-bold text-gray-900">
                {supportRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <Users className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Đang hỗ trợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {supportRequests.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {supportRequests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Buổi học tuần</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Support Requests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Support Requests */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Yêu cầu hỗ trợ bộ môn</h2>
                  <p className="text-sm text-gray-600">Xem và xử lý các yêu cầu hỗ trợ</p>
                </div>
              </div>

              {supportRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Không có yêu cầu hỗ trợ nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                        request.status === 'pending'
                          ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white'
                          : request.status === 'in_progress'
                          ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'
                          : 'border-green-200 bg-gradient-to-br from-green-50 to-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-3">
                            <span className="font-bold text-gray-900">{request.studentName}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm font-semibold text-gray-700">Môn: {request.subject}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">Tutor: {request.tutorName}</span>
                          </div>
                          <p className="text-gray-700 mb-3 leading-relaxed">{request.reason}</p>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">Ngày: {request.date}</span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                request.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {request.status === 'pending'
                                ? 'Chờ xử lý'
                                : request.status === 'in_progress'
                                ? 'Đang hỗ trợ'
                                : 'Hoàn thành'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="btn-primary text-sm whitespace-nowrap"
                            >
                              Chấp nhận
                            </button>
                          )}
                          {request.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteRequest(request.id)}
                              className="btn-primary text-sm flex items-center space-x-1 whitespace-nowrap"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Hoàn thành</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Schedule & Actions */}
          <div className="space-y-6">
            {/* Teaching Schedule */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Lịch dạy tuần này</h2>
              </div>
              <div className="space-y-3">
                {[
                  { date: '14/11', time: '14:00-15:30', student: 'Nguyễn Văn A', subject: 'Toán' },
                  { date: '16/11', time: '16:00-17:30', student: 'Trần Thị B', subject: 'Lý' },
                ].map((schedule, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <p className="font-bold text-gray-900">{schedule.date}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{schedule.time}</p>
                        <p className="text-sm text-gray-600 mt-1">{schedule.student}</p>
                        <p className="text-xs text-gray-500">{schedule.subject}</p>
                      </div>
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                    <button className="btn-secondary w-full text-sm py-2">Chi tiết</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
              <div className="space-y-2">
                <button className="w-full btn-secondary text-left flex items-center space-x-3 p-4">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  <span>Liên hệ phụ huynh</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center space-x-3 p-4">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span>Gửi báo cáo ngắn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
