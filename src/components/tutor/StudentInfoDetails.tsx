import { ReactNode } from 'react'
import {
  Award,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Heart,
  MapPin,
  MessageSquare,
  PenSquare,
  Phone,
  School,
  Sparkles,
  UserCircle,
} from 'lucide-react'
import InfoCard from './InfoCard'

interface StudentBasics {
  id: string
  name?: string
  avatarUrl?: string
  grade?: string
  school?: string
  subjects?: string[]
  favoriteSubjects?: string[]
  hobbies?: string[]
  strengths?: string[]
  improvements?: string[]
  age?: number
  dateOfBirth?: string
  parent?: string
  contact?: string
  preferredChannel?: string
  address?: string
  parent1Name?: string
  parent1Email?: string
  parent1Number?: string
  parent2Name?: string
  parent2Email?: string
  parent2Number?: string
  parentNotes?: string
  moreInfo?: string
}

interface StudentDetailExtras {
  academicLevel?: string
  favoriteSubjects?: string[]
  hobbies?: string[]
  strengths?: string[]
  improvements?: string[]
  notes?: string
  parent1Request?: string
  parent2Request?: string
  school?: string
  grade?: string
  parent1Name?: string
  parent1Email?: string
  parent1Number?: string
  parent2Name?: string
  parent2Email?: string
  parent2Number?: string
}

interface NextScheduleInfo {
  subject?: string
  dateLabel?: string
  timeLabel?: string
}

interface StudentInfoDetailsProps {
  student?: StudentBasics
  detail?: StudentDetailExtras
  nextSchedule?: NextScheduleInfo | null
  onJoinNextSchedule?: () => void
}

const renderChipList = (items?: string[], emptyLabel?: string) => {
  if (!items || items.length === 0) {
    return emptyLabel ? <p className="text-sm text-gray-500">{emptyLabel}</p> : null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <div className="p-4 border border-gray-200 rounded-2xl bg-white space-y-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
    </div>
    {children}
  </div>
)

export default function StudentInfoDetails({
  student,
  detail,
  nextSchedule,
  onJoinNextSchedule,
}: StudentInfoDetailsProps) {
  if (!student) return null

  const enrolledSubjects = student.subjects ?? []
  const favoriteSubjects = detail?.favoriteSubjects ?? student.favoriteSubjects ?? []
  const hobbies = detail?.hobbies ?? student.hobbies ?? []
  const strengths = detail?.strengths ?? student.strengths ?? []
  const improvements = detail?.improvements ?? student.improvements ?? []
  const displaySchool = detail?.school || student.school || 'Chưa cập nhật'
  const displayGrade = detail?.grade || detail?.academicLevel || student.grade || 'Chưa cập nhật'
  const displayParent1Name = detail?.parent1Name || student.parent1Name
  const displayParent2Name = detail?.parent2Name || student.parent2Name
  const displayParent1Contact =
    [detail?.parent1Email || student.parent1Email, detail?.parent1Number || student.parent1Number]
      .filter(Boolean)
      .join(' · ')
  const displayParent2Contact =
    [detail?.parent2Email || student.parent2Email, detail?.parent2Number || student.parent2Number]
      .filter(Boolean)
      .join(' · ')
  const displayNotes = detail?.notes || student.parentNotes || student.moreInfo || 'Chưa có ghi chú nào từ phụ huynh.'

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
      <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/70 p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 shadow-inner">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-white">
          {student.avatarUrl ? (
            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100">
              <UserCircle className="w-10 h-10 text-primary-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Học sinh</p>
          <h4 className="text-2xl font-bold text-gray-900">{student.name || 'Chưa có tên'}</h4>
          <p className="text-sm text-gray-500">
            {displayGrade} · {displaySchool}
          </p>
          {enrolledSubjects.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Chưa có môn học cụ thể</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard icon={<School className="w-4 h-4 text-primary-600" />} label="Trường học" value={displaySchool} />
        <InfoCard icon={<GraduationCap className="w-4 h-4 text-primary-600" />} label="Lớp học" value={displayGrade} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard
          icon={<Phone className="w-4 h-4 text-primary-600" />}
          label="Liên hệ"
          value={student.contact || 'Chưa có'}
          helper={student.preferredChannel || undefined}
        />
        <InfoCard icon={<MapPin className="w-4 h-4 text-primary-600" />} label="Địa chỉ" value={student.address || 'Chưa cập nhật'} />
      </div>

      {(displayParent1Name || displayParent2Name) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard
            icon={<UserCircle className="w-4 h-4 text-primary-600" />}
            label="Phụ huynh 1"
            value={displayParent1Name || 'Chưa cập nhật'}
            helper={displayParent1Contact || undefined}
          />
          <InfoCard
            icon={<UserCircle className="w-4 h-4 text-primary-600" />}
            label="Phụ huynh 2"
            value={displayParent2Name || 'Chưa cập nhật'}
            helper={displayParent2Contact || undefined}
          />
        </div>
      )}

      {nextSchedule && (
      <Section title="Buổi học sắp tới" icon={<Calendar className="w-4 h-4" />}>
          <p className="text-base font-bold text-gray-900">{nextSchedule.subject || 'Chưa cập nhật'}</p>
          <p className="text-sm text-gray-600">
            {nextSchedule.dateLabel} · {nextSchedule.timeLabel}
          </p>
        {onJoinNextSchedule && (
          <button onClick={onJoinNextSchedule} className="btn-primary text-xs px-4 py-2 mt-3 self-start">
            Vào lớp
          </button>
        )}
        </Section>
      )}

      <Section title="Sở thích & Thế mạnh" icon={<Sparkles className="w-4 h-4" />}>
        {renderChipList(favoriteSubjects, 'Chưa có môn yêu thích')}
        {hobbies.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" /> Sở thích
            </p>
            <p className="text-sm text-gray-700">{hobbies.join(', ')}</p>
          </div>
        )}
        {strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" /> Thế mạnh
            </p>
            <p className="text-sm text-gray-700">{strengths.join(', ')}</p>
          </div>
        )}
        {improvements.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <PenSquare className="w-3 h-3 text-blue-500" /> Điểm cần cải thiện
            </p>
            <p className="text-sm text-gray-700">{improvements.join(', ')}</p>
          </div>
        )}
        {hobbies.length === 0 && strengths.length === 0 && improvements.length === 0 && favoriteSubjects.length === 0 && (
          <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
        )}
      </Section>

      {(detail?.parent1Request || detail?.parent2Request) && (
        <Section title="Yêu cầu từ phụ huynh" icon={<ClipboardList className="w-4 h-4" />}>
          {detail?.parent1Request && (
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Phụ huynh 1</p>
              <p>{detail.parent1Request}</p>
            </div>
          )}
          {detail?.parent2Request && (
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Phụ huynh 2</p>
              <p>{detail.parent2Request}</p>
            </div>
          )}
        </Section>
      )}

      <Section title="Ghi chú & Định hướng" icon={<PenSquare className="w-4 h-4" />}>
        <p className="text-sm text-gray-700 leading-relaxed">{displayNotes}</p>
      </Section>
    </div>
  )
}


