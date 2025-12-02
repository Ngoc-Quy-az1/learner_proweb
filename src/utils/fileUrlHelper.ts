// Helper functions để xử lý nhiều URL được nối bằng \n

/**
 * Nối nhiều URL thành một string, cách nhau bằng \n
 * @param urls - Mảng các URL
 * @returns String với các URL được nối bằng \n
 */
export const joinFileUrls = (urls: string[]): string => {
  return urls.filter(Boolean).join('\n')
}

/**
 * Tách URL thành mảng các URL
 * - Hỗ trợ cả string (nối bằng \n) và mảng string[]
 * @param urlInput - String hoặc mảng string chứa các URL
 * @returns Mảng các URL
 */
export const splitFileUrls = (urlInput: string | string[] | undefined | null): string[] => {
  if (!urlInput) return []

  if (Array.isArray(urlInput)) {
    // Đã là mảng URL thì chỉ cần lọc bớt giá trị rỗng
    return urlInput.filter((url) => !!url && url.trim() !== '')
  }

  // Trường hợp còn lại là string - tách theo \n (định dạng cũ)
  return urlInput.split('\n').filter((url) => !!url && url.trim() !== '')
}

/**
 * Thêm URL mới vào danh sách URL hiện có
 * @param existingUrls - String URL hiện có (có thể chứa nhiều URL nối bằng \n)
 * @param newUrls - Mảng URL mới cần thêm
 * @returns String mới với các URL được nối bằng \n
 */
export const appendFileUrls = (existingUrls: string | undefined | null, newUrls: string[]): string => {
  const existing = splitFileUrls(existingUrls)
  const allUrls = [...existing, ...newUrls.filter(Boolean)]
  return joinFileUrls(allUrls)
}

