import { useEffect, useRef, useState } from 'react'

const videos = [
  '/3209663-uhd_3840_2160_25fps.mp4',
  '/4769557-uhd_4096_2160_25fps.mp4',
  '/4769635-hd_1920_1080_30fps.mp4',
  '/855418-hd_1920_1080_25fps.mp4',
  '/3981918-uhd_3840_2160_30fps.mp4'
]

export default function VideoBackground() {
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [activeVideo, setActiveVideo] = useState(1) // 1 hoặc 2
  const isTransitioningRef = useRef(false)

  // Khởi tạo video đầu tiên
  useEffect(() => {
    const video1 = video1Ref.current
    const video2 = video2Ref.current
    if (!video1 || !video2 || videos.length === 0) return

    // Video đầu tiên
    video1.src = videos[0]
    video1.load()
    video1.play().catch(console.error)

    // Preload video thứ 2 nếu có
    if (videos.length > 1) {
      video2.src = videos[1]
      video2.load()
    }
  }, [])

  // Xử lý khi video kết thúc
  useEffect(() => {
    const currentVideo = activeVideo === 1 ? video1Ref.current : video2Ref.current
    const nextVideo = activeVideo === 1 ? video2Ref.current : video1Ref.current
    if (!currentVideo || !nextVideo) return

    const handleVideoEnd = () => {
      if (isTransitioningRef.current || videos.length === 0) return
      isTransitioningRef.current = true

      const nextIndex = (currentVideoIndex + 1) % videos.length
      const nextNextIndex = (nextIndex + 1) % videos.length

      // Preload video tiếp theo nếu chưa preload
      const nextVideoSrc = videos[nextIndex]
      if (nextVideo.src !== nextVideoSrc && nextVideoSrc) {
        nextVideo.src = nextVideoSrc
        nextVideo.load()
      }

      const fadeInNext = () => {
        nextVideo.removeEventListener('canplay', fadeInNext)
        nextVideo.currentTime = 0
        nextVideo.style.opacity = '0'
        nextVideo.style.transition = 'opacity 1.5s ease-in-out'

        nextVideo.play().then(() => {
          currentVideo.style.transition = 'opacity 1.5s ease-in-out'

          requestAnimationFrame(() => {
            nextVideo.style.opacity = '1'
            currentVideo.style.opacity = '0'
          })

          setTimeout(() => {
            currentVideo.pause()
            currentVideo.currentTime = 0

            // Update state
            const newActiveVideo = activeVideo === 1 ? 2 : 1
            setCurrentVideoIndex(nextIndex)
            setActiveVideo(newActiveVideo)
            isTransitioningRef.current = false

            // Preload video tiếp theo
            const nextNextVideo = newActiveVideo === 1 ? video2Ref.current : video1Ref.current
            if (nextNextVideo && videos[nextNextIndex]) {
              nextNextVideo.src = videos[nextNextIndex]
              nextNextVideo.load()
            }
          }, 1500)
        }).catch(console.error)
      }

      if (nextVideo.readyState >= 3) {
        fadeInNext()
      } else {
        nextVideo.addEventListener('canplay', fadeInNext, { once: true })
      }
    }

    currentVideo.addEventListener('ended', handleVideoEnd)
    return () => {
      currentVideo.removeEventListener('ended', handleVideoEnd)
    }
  }, [currentVideoIndex, activeVideo])

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
      <video
        ref={video1Ref}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
        style={{ 
          filter: 'brightness(0.4)',
          opacity: activeVideo === 1 ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          zIndex: activeVideo === 1 ? 1 : 0
        }}
      />
      <video
        ref={video2Ref}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
        style={{ 
          filter: 'brightness(0.4)',
          opacity: activeVideo === 2 ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          zIndex: activeVideo === 2 ? 1 : 0
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-10"></div>
    </div>
  )
}
