import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { apiCall } from '../config/api'
import { setCookie, deleteCookie } from '../utils/cookies'
import { getUserFromStorage, setUserInStorage, removeUserFromStorage, getTokensFromStorage, setTokensInStorage, removeTokensFromStorage } from '../utils/tabStorage'

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
  const isRestoringRef = useRef(true)

  useEffect(() => {
    // Check for stored user session using tabId
    // Each tab has its own user and tokens stored in localStorage with tabId prefix
    const storedUser = getUserFromStorage()
    const storedTokens = getTokensFromStorage()
    
    // Restore user if we have user data and tokens (accessToken can be refreshed if needed)
    if (storedUser && storedTokens) {
      try {
        const user = JSON.parse(storedUser)
        setUser(user)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        // Clear corrupted data only in this tab
        removeUserFromStorage()
        removeTokensFromStorage()
      }
    }
    setLoading(false)
    // Mark restoration as complete after a delay to allow state to settle
    // This prevents storage events from other tabs interfering during restoration
    setTimeout(() => {
      isRestoringRef.current = false
    }, 1000)
    
    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      // Don't react to storage events during initial restoration
      if (isRestoringRef.current) {
        return
      }
      
      // sessionStorage doesn't trigger storage events between tabs
      // So we don't need to handle cross-tab sync for user/tokens
      // Each tab manages its own session independently
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
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
        avatar: apiUser.avatarUrl || apiUser.avatar, // Use avatarUrl from API, fallback to avatar
      }

      // Store both user and tokens in localStorage with tabId prefix
      // This allows each tab to have its own user and tokens independently
      // while still supporting "Remember me" functionality
      setUser(user)
      setUserInStorage(JSON.stringify(user))
      setTokensInStorage(JSON.stringify(tokens))
      
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
      // Get refresh token from localStorage with tabId
      const storedTokens = getTokensFromStorage()
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
      removeUserFromStorage()
      removeTokensFromStorage()
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

