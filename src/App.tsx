import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import StudentDashboard from './pages/StudentDashboard'
import TutorDashboard from './pages/TutorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getUserFromStorage, getTokensFromStorage } from './utils/tabStorage'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checkingStorage, setCheckingStorage] = useState(true)
  
  useEffect(() => {
    // Give AuthContext time to restore from localStorage
    // Check if user exists in localStorage even if AuthContext hasn't restored yet
    if (!loading) {
      if (!user) {
        // Check localStorage with tabId for both user and tokens (tab-specific)
        const storedUser = getUserFromStorage()
        const storedTokens = getTokensFromStorage()
        
        if (storedUser && storedTokens) {
          // Session exists in storage, wait longer for AuthContext to restore
          // This handles cases where AuthContext restore is delayed
          const timer = setTimeout(() => {
            setCheckingStorage(false)
          }, 1500)
          return () => clearTimeout(timer)
        } else {
          // No session in storage, safe to redirect
          setCheckingStorage(false)
        }
      } else {
        // User is already restored
        setCheckingStorage(false)
      }
    }
  }, [loading, user])
  
  if (loading || checkingStorage) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!user) {
    // Redirect to login with return URL to preserve the current path
    const returnUrl = location.pathname + location.search
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />
  }
  
  if (!allowedRoles.includes(user.role)) {
    // User role doesn't match - redirect to appropriate dashboard based on role
    // Preserve the section query param if possible
    const section = new URLSearchParams(location.search).get('section')
    const sectionParam = section ? `?section=${section}` : ''
    
    if (user.role === 'student' || user.role === 'parent') {
      return <Navigate to={`/student${sectionParam}`} replace />
    } else if (user.role === 'tutor') {
      return <Navigate to={`/tutor${sectionParam}`} replace />
    } else if (user.role === 'admin') {
      return <Navigate to={`/admin${sectionParam}`} replace />
    }
    
    // Fallback to home if role doesn't match any dashboard
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'parent']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor"
        element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App

