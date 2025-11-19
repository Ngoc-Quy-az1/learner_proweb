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
      container: 'space-x-3'
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
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 md:h-20 w-auto',
  }[size]

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl md:text-4xl',
  }[size]

  return (
    <Link to="/" className={`flex items-center ${classes.container} ${className}`}>
      <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className={logoSize} />
      <span className={`font-semibold ${textSize} font-display`}>
        <span style={{ color: '#528fcd' }}>skillar</span>
        <span style={{ color: '#032757' }}>Tutor</span>
      </span>
      {showTagline && (
        <span className={`font-light tracking-wide ${getTaglineColor()} ${classes.tagline}`}>
          Where Growth Begins
        </span>
      )}
    </Link>
  )
}

