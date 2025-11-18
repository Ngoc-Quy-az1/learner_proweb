import { useState } from 'react'
import Layout from '../components/Layout'
import { Users, UserPlus, Calendar, FileText, AlertCircle, TrendingUp, Settings, Shield, BarChart3 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

interface SupportRequest {
  id: string
  studentName: string
  subject: string
  tutorName: string
  date: string
  status: 'pending' | 'assigned'
}

export default function AdminDashboard() {
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
  })

  const [users] = useState<User[]>([
    { id: '1', name: 'Nguyễn Văn A', email: 'student@skillar.com', role: 'Học sinh', status: 'active' },
    { id: '2', name: 'Tutor B', email: 'tutor@skillar.com', role: 'Tutor', status: 'active' },
    { id: '3', name: 'GV Toán C', email: 'teacher@skillar.com', role: 'Giáo viên bộ môn', status: 'active' },
  ])

  const [supportRequests] = useState<SupportRequest[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn A',
      subject: 'Toán',
      tutorName: 'Tutor B',
      date: '12/11/2024',
      status: 'pending',
    },
  ])

  const handleAddUser = () => {
    console.log('Add user:', newUser)
    setShowAddUserModal(false)
    setNewUser({ name: '', email: '', role: 'student', password: '' })
    alert('Đã tạo tài khoản thành công!')
  }

  const handleAssignTeacher = (requestId: string) => {
    console.log('Assign teacher to request:', requestId)
    alert('Đã phân công giáo viên bộ môn')
  }

  return (
    <Layout title="Dashboard Admin">
      <div className="h-full overflow-y-auto space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <Users className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Tổng người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Học sinh hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">25</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Yêu cầu hỗ trợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {supportRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Buổi học hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Quản lý người dùng</h2>
                  <p className="text-sm text-gray-600">Tạo và quản lý tài khoản hệ thống</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm người dùng</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{user.role}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                              Sửa
                            </button>
                            <span className="text-gray-300">|</span>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Requests */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <AlertCircle className="w-5 h-5 text-primary-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Yêu cầu hỗ trợ bộ môn</h2>
                  <p className="text-sm text-gray-600">Phân công giáo viên hỗ trợ</p>
                </div>
              </div>

              {supportRequests.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Không có yêu cầu hỗ trợ nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50"
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
                          <p className="text-sm text-gray-500 mb-3">Ngày: {request.date}</p>
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            Chờ xử lý
                          </span>
                        </div>
                        <div className="ml-4">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleAssignTeacher(request.id)}
                              className="btn-primary text-sm"
                            >
                              Phân công giáo viên
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

          {/* Right Column - System Overview */}
          <div className="space-y-6">
            {/* System Reports */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Báo cáo hệ thống</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tổng buổi học tuần này</p>
                    <p className="text-2xl font-bold text-gray-900">45</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tỷ lệ hoàn thành</p>
                    <p className="text-2xl font-bold text-gray-900">78%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Báo cáo đã gửi</p>
                    <p className="text-2xl font-bold text-gray-900">38</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Thao tác nhanh</h2>
              </div>
              <div className="space-y-2">
                <button className="w-full btn-secondary text-left flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Gửi thông báo hệ thống</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Xem báo cáo chi tiết</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Cài đặt hệ thống</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Thêm người dùng mới</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Nhập tên"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="student">Học sinh</option>
                  <option value="parent">Phụ huynh</option>
                  <option value="tutor">Tutor</option>
                  <option value="teacher">Giáo viên bộ môn</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu tạm
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Mật khẩu tạm thời"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleAddUser}
                className="btn-primary"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
