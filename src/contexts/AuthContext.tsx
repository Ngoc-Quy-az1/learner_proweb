import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiCall } from '../config/api'
import { setCookie, deleteCookie, getCookie } from '../utils/cookies'

export interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'parent' | 'tutor' | 'admin' | 'teacher'
  avatar?: string
  phone?: string
  birthday?: string
  isEmailVerified?: boolean
  isActive?: boolean
}

export interface Tokens {
  access: {
    token: string
    expires: string
  }
  refresh: {
    token: string
    expires: string
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user')
    const storedTokens = localStorage.getItem('tokens')
    const accessToken = getCookie('accessToken')
    
    if (storedUser && storedTokens && accessToken) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await apiCall<{ user: any; tokens: Tokens }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const { user: apiUser, tokens } = data

      // Map API user to our User interface
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        phone: apiUser.phone,
        birthday: apiUser.birthday,
        isEmailVerified: apiUser.isEmailVerified,
        isActive: apiUser.isActive,
        avatar: apiUser.avatar,
      }

      // Store user in localStorage
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Store refresh token in localStorage
      localStorage.setItem('tokens', JSON.stringify(tokens))
      
      // Store access token in cookie with expiration
      const expiresDate = new Date(tokens.access.expires)
      const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      setCookie('accessToken', tokens.access.token, daysUntilExpiry)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Đã xảy ra lỗi khi đăng nhập')
    }
  }

  const logout = async () => {
    try {
      // Get refresh token from localStorage
      const storedTokens = localStorage.getItem('tokens')
      if (storedTokens) {
        const tokens: Tokens = JSON.parse(storedTokens)
        const refreshToken = tokens.refresh?.token

        if (refreshToken) {
          // Call logout API
          await apiCall('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({
              refreshToken,
            }),
          }, false) // Don't retry on 401 for logout
        }
      }
    } catch (error) {
      // Even if API call fails, still clear local data
      console.error('Logout API error:', error)
    } finally {
      // Clear local data regardless of API call result
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('tokens')
      deleteCookie('accessToken')
    }
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

