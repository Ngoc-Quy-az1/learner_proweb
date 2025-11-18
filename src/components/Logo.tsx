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

  return (
    <Link to="/" className={`flex items-center ${classes.container} ${className}`}>
      <div className="flex items-end gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-300 w-9 h-9 shadow-lg text-white font-extrabold text-lg">
            S
          </div>
          <span
            className={`font-black uppercase ${classes.logo} text-[#8fd8ff] leading-none tracking-[0.35em]`}
            style={{ letterSpacing: '0.2em' }}
          >
            SKILL
            <span className="relative inline-block text-[#8fd8ff]">
              A
              <span
                className={`absolute left-1/2 transform -translate-x-1/2 rounded-full bg-[#c7c7c7] ${classes.dot} block`}
              ></span>
            </span>
            R
          </span>
        </div>
      </div>
      {showTagline && (
        <span className={`font-light tracking-wide ${getTaglineColor()} ${classes.tagline}`}>
          Where Growth Begins
        </span>
      )}
    </Link>
  )
}

