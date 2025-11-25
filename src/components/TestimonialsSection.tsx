import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  text: string
  author: string
  location: string
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
}

export default function TestimonialsSection({ testimonials: propTestimonials }: TestimonialsSectionProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  
  const testimonials = propTestimonials || [
    {
      text: '“Con tôi trước đây rất hay quên bài và làm bài tập nửa chừng. Sau 2 tháng học với Skillar, con chủ động ngồi học, tập trung hơn và tự hoàn thành bài tập trước khi đi chơi.”',
      author: 'Phụ huynh học sinh lớp 5',
      location: ''
    }
  ]

  return (
    <section className="relative z-10 py-20 lg:py-32" style={{ backgroundColor: '#002769' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-yellow-400 font-semibold uppercase tracking-widest text-sm mb-4">Phụ huynh yêu thích Skillar</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-8">
            Phụ huynh yêu thích SKILLAR
          </h2>
        </div>
        
        {/* Testimonial Content - No Card */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <div className="absolute -top-8 left-8 text-8xl text-blue-400/30 font-serif leading-none">"</div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors shadow-lg z-20"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors shadow-lg z-20"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          
          {/* Testimonial Text */}
          <div className="relative z-10 text-center px-16">
            <p className="text-xl lg:text-2xl text-white leading-relaxed mb-8 font-light">
              {testimonials[currentTestimonial].text}
            </p>
            
            {/* Rating Stars */}
            <div className="flex items-center justify-center space-x-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-yellow-400 text-3xl">★</span>
              ))}
            </div>

            {/* Author Info */}
            <div className="text-white">
              <p className="font-bold text-xl mb-1">{testimonials[currentTestimonial].author}</p>
              {testimonials[currentTestimonial].location && (
                <p className="text-base text-white/80">{testimonials[currentTestimonial].location}</p>
              )}
            </div>
          </div>
          
          {/* Pagination Dots */}
          <div className="flex justify-center space-x-3 mt-12">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === currentTestimonial ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

