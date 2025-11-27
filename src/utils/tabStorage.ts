/**
 * Utility functions for tab-specific storage using tabId
 * Each tab gets a unique ID stored in sessionStorage
 * User and tokens are stored in localStorage with tabId prefix
 */

/**
 * Get or create a unique tab ID for this tab
 * Tab ID is stored in sessionStorage (tab-specific)
 */
export function getTabId(): string {
  let tabId = sessionStorage.getItem('tabId')
  if (!tabId) {
    // Generate a unique ID for this tab
    tabId = crypto.randomUUID()
    sessionStorage.setItem('tabId', tabId)
  }
  return tabId
}

/**
 * Get storage key for user with tabId
 */
export function getUserKey(): string {
  return `user_${getTabId()}`
}

/**
 * Get storage key for tokens with tabId
 */
export function getTokensKey(): string {
  return `tokens_${getTabId()}`
}

/**
 * Get user from localStorage with tabId
 */
export function getUserFromStorage(): string | null {
  return localStorage.getItem(getUserKey())
}

/**
 * Set user in localStorage with tabId
 */
export function setUserInStorage(user: string): void {
  localStorage.setItem(getUserKey(), user)
}

/**
 * Remove user from localStorage with tabId
 */
export function removeUserFromStorage(): void {
  localStorage.removeItem(getUserKey())
}

/**
 * Get tokens from localStorage with tabId
 */
export function getTokensFromStorage(): string | null {
  return localStorage.getItem(getTokensKey())
}

/**
 * Set tokens in localStorage with tabId
 */
export function setTokensInStorage(tokens: string): void {
  localStorage.setItem(getTokensKey(), tokens)
}

/**
 * Remove tokens from localStorage with tabId
 */
export function removeTokensFromStorage(): void {
  localStorage.removeItem(getTokensKey())
}

/**
 * Clear all storage for this tab
 */
export function clearTabStorage(): void {
  removeUserFromStorage()
  removeTokensFromStorage()
  sessionStorage.removeItem('tabId')
}

