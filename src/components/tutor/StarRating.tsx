import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (val: number) => void
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= value
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

