import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  taglineColor?: 'black' | 'white' | 'auto'
}

export default function Logo({ className = '', showTagline = true, size = 'md', taglineColor = 'auto' }: LogoProps) {
  const sizeClasses = {
    sm: {
      logo: 'text-xl tracking-[0.3em]',
      tagline: 'text-[10px]',
      dot: 'w-1.5 h-1.5 -bottom-1',
      container: 'space-x-2'
    },
    md: {
      logo: 'text-3xl tracking-[0.4em]',
      tagline: 'text-xs',
      dot: 'w-2 h-2 -bottom-1',
      container: 'space-x-2 sm:space-x-3'
    },
    lg: {
      logo: 'text-4xl tracking-[0.55em]',
      tagline: 'text-sm',
      dot: 'w-2.5 h-2.5 -bottom-1',
      container: 'space-x-3'
    },
    xl: {
      logo: 'text-5xl md:text-6xl tracking-[0.65em]',
      tagline: 'text-base md:text-lg',
      dot: 'w-3 h-3 -bottom-1.5',
      container: 'space-x-4'
    }
  } as const

  const classes = sizeClasses[size]
  
  const getTaglineColor = () => {
    if (taglineColor === 'black') return 'text-black'
    if (taglineColor === 'white') return 'text-white'
    return 'text-black'
  }

  const logoSize = {
    sm: 'h-6 sm:h-8 w-auto',
    md: 'h-8 sm:h-10 md:h-12 w-auto',
    lg: 'h-12 sm:h-14 w-auto',
    xl: 'h-14 sm:h-16 md:h-20 w-auto',
  }[size]

  const textSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-2xl sm:text-3xl md:text-4xl',
  }[size]

  return (
    <Link to="/" className={`flex items-center ${classes.container} ${className} min-w-0`}>
      <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className={`${logoSize} flex-shrink-0`} />
      <span className={`${textSize} flex-shrink-0 whitespace-nowrap`} style={{ fontFamily: "'Ubuntu', sans-serif", fontWeight: 700 }}>
        <span style={{ color: '#032757' }}>skillar</span>
        <span style={{ color: '#528fcd' }}>Tutor</span>
      </span>
      {showTagline && (
        <span className={`font-light tracking-wide ${getTaglineColor()} ${classes.tagline} flex-shrink-0 hidden sm:inline whitespace-nowrap`}>
          Where Growth Begins
        </span>
      )}
    </Link>
  )
}

