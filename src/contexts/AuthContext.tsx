import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'parent' | 'tutor' | 'admin'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual API call
    // For demo purposes, accept any email/password
    const mockUsers: Record<string, User> = {
      'student@skillar.com': { id: '1', name: 'Nguyễn Văn A', email: 'student@skillar.com', role: 'student' },
      'parent@skillar.com': { id: '2', name: 'Phụ huynh A', email: 'parent@skillar.com', role: 'parent' },
      'tutor@skillar.com': { id: '3', name: 'Tutor B', email: 'tutor@skillar.com', role: 'tutor' },
      'admin@skillar.com': { id: '4', name: 'Admin SKILLAR', email: 'admin@skillar.com', role: 'admin' },
    }
    
    const foundUser = mockUsers[email]
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('user', JSON.stringify(foundUser))
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

