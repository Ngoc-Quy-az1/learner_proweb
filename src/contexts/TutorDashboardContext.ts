import { createContext, useContext } from 'react'

export interface TutorDashboardContextValue {
  [key: string]: any
}

export const TutorDashboardContext = createContext<TutorDashboardContextValue | null>(null)

export const useTutorDashboardContext = () => {
  const context = useContext(TutorDashboardContext)
  if (!context) {
    throw new Error('useTutorDashboardContext must be used within a TutorDashboardContext provider')
  }
  return context
}


