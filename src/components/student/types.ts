// Shared types for student dashboard components
import { ChecklistItem } from '../dashboard'

export interface TutorInfo {
  id: string
  name?: string
  email?: string
  phone?: string
  avatarUrl?: string
  address?: string
  moreInfo?: string
  currentLevel?: string
  cvUrl?: string
}

export interface DailyReport {
  id: string
  subject: string
  date: Date
  tutor: string
  summary: string
  generalComment?: string
  criteria: {
    id: string
    metric: string
    description: string
    rating: number
    note: string
  }[]
}

export type ChecklistWithDate = ChecklistItem & { date: Date }

export interface StudentHighlightCard {
  id: string
  label: string
  value: string
  helper: string
}

