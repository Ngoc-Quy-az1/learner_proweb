// API Configuration
import { getCookie, setCookie } from '../utils/cookies'

// Lấy API_BASE_URL từ biến môi trường, fallback về giá trị mặc định nếu không có
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://47.128.68.241:3000/v1'

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const tokens = localStorage.getItem('tokens')
      if (!tokens) {
        throw new Error('No refresh token available')
      }

      const { refresh } = JSON.parse(tokens)
      if (!refresh || !refresh.token) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refresh.token,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to refresh token')
      }

      const data = await response.json()
      
      // Handle response format: { tokens: { access, refresh } } or { access, refresh }
      const tokenData = data.tokens || data
      const { access, refresh: newRefresh } = tokenData
      
      if (!access || !access.token) {
        throw new Error('Invalid token response format')
      }

      // Update tokens in localStorage
      localStorage.setItem('tokens', JSON.stringify({ access, refresh: newRefresh }))

      // Update access token in cookie
      const expiresDate = new Date(access.expires)
      const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      setCookie(ACCESS_TOKEN_COOKIE_NAME, access.token, daysUntilExpiry)

      return access.token
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('tokens')
      localStorage.removeItem('user')
      setCookie(ACCESS_TOKEN_COOKIE_NAME, '', -1)
      throw error
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Helper function to make API calls with automatic token refresh
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retry: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Get access token from cookie
  let accessToken = getCookie(ACCESS_TOKEN_COOKIE_NAME)
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If 401 and retry is enabled, try to refresh token
  if (response.status === 401 && retry) {
    try {
      const newAccessToken = await refreshAccessToken()
      
      // Retry the original request with new token
      const retryHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newAccessToken}`,
        ...options.headers,
      }

      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
      })

      if (!retryResponse.ok) {
        let errorMessage = `API Error: ${retryResponse.statusText}`
        try {
          const errorData = await retryResponse.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage)
      }

      return retryResponse.json()
    } catch (refreshError) {
      // If refresh fails, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Session expired. Please login again.')
    }
  }

  // Handle 403 Forbidden - User doesn't have admin role
  if (response.status === 403) {
    let errorMessage = 'Bạn không có quyền truy cập. Chỉ admin mới có thể thực hiện thao tác này.'
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If response is not JSON, use default message
    }
    throw new Error(errorMessage)
  }

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If response is not JSON, use status text
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses (e.g., DELETE 204 No Content)
  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  try {
    return JSON.parse(responseText)
  } catch {
    // If not JSON, return as plain text
    return responseText as unknown as T
  }
}

