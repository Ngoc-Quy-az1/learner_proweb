import { Check, Play } from 'lucide-react'

interface TutoringSectionProps {
  onGetTutor?: () => void
}

export default function TutoringSection({ onGetTutor }: TutoringSectionProps) {
  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Small Yellow Text */}
            <div>
              <span className="text-yellow-500 font-semibold text-xs sm:text-sm uppercase tracking-wide" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                Đối tác đồng hành cùng phụ huynh
              </span>
            </div>
            
            {/* Main Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight">
              Hãy để SKILLAR trở thành người đồng hành giúp con tăng tập trung và hoàn thành bài tập mỗi ngày.
            </h2>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              Chúng tôi không chỉ dạy, mà còn giúp con hình thành:
            </p>
            
            {/* Key Features */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <p className="text-gray-700 text-base sm:text-lg">Kỷ luật học tập – hoàn thành bài tập đúng hạn</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <p className="text-gray-700 text-base sm:text-lg">Tăng khả năng tập trung khi học và làm bài</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <p className="text-gray-700 text-base sm:text-lg">Hình thành thói quen tự học và ghi nhớ</p>
          </div>
            </div>
            <p className="text-base sm:text-lg text-gray-800 leading-relaxed italic flex items-start gap-2">
              <span role="img" aria-label="target">🎯</span>
              Chương trình phù hợp với học sinh từ Tiểu học đến THCS – đặc biệt là các bạn dễ xao nhãng, học chưa đều, chưa có thói quen học tập.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button 
                onClick={onGetTutor}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Tìm gia sư phù hợp
              </button>
            </div>
          </div>

          {/* Right Column - Student Images Grid (3 columns layout) */}
          <div className="relative flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="relative w-full max-w-[560px] h-[300px] sm:h-[380px] md:h-[420px] lg:h-[480px]">
              {/* A+ badge - Top left, outside images */}
              <div className="absolute left-[20px] sm:left-[30px] md:left-[35px] top-[30px] sm:top-[40px] md:top-[50px] z-30">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl" style={{ border: '3px solid #f5c25a' }}>
                  <span className="text-base sm:text-lg md:text-xl font-extrabold" style={{ color: '#f59e0b' }}>A+</span>
                </div>
              </div>

              {/* Column 1: Single tall image - Girl with OK sign in cyan frame */}
              <div className="absolute left-0 top-[40px] sm:top-[50px] md:top-[60px] w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[240px] sm:h-[300px] md:h-[330px] lg:h-[360px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#5dd4d4' }}>
                <img src="/3.jpg" alt="student left" className="w-full h-full object-cover" />
              </div>

              {/* Column 2: Two stacked images - Gap 30px từ cột 1 */}
              {/* Top image - Boy holding board (cyan frame) */}
              <div className="absolute left-[130px] sm:left-[150px] md:left-[170px] lg:left-[180px] top-0 w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[140px] sm:h-[180px] md:h-[200px] lg:h-[210px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#00bcd4' }}>
                <img src="/2.jpg" alt="student middle top" className="w-full h-full object-cover" />
              </div>

              {/* Bottom image - Girl with book on head, coral/pink frame with ABC */}
              <div className="absolute left-[130px] sm:left-[150px] md:left-[170px] lg:left-[180px] bottom-[25px] sm:bottom-[30px] md:bottom-[35px] lg:bottom-[40px] w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[140px] sm:h-[180px] md:h-[200px] lg:h-[210px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#d17a8f' }}>
                <img src="/5.jpg" alt="student middle bottom" className="w-full h-full object-cover" />
                {/* ABC label on the frame */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 z-10" style={{ fontFamily: 'cursive', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  ABC
                </div>
              </div>

              {/* Column 3: Two images not aligned - Gap 30px từ cột 2, thấp hơn cột 1 */}
              {/* Top image - Girl in orange sweater in light cyan frame */}
              <div className="absolute left-[260px] sm:left-[300px] md:left-[340px] lg:left-[360px] top-[50px] sm:top-[60px] md:top-[70px] lg:top-[80px] w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[120px] sm:h-[150px] md:h-[165px] lg:h-[180px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#a8d5d5' }}>
                <img src="/4.jpg" alt="student right top" className="w-full h-full object-cover" />
              </div>

              {/* Math label - Top right, handwritten style */}
              <div className="absolute left-[370px] sm:left-[430px] md:left-[490px] lg:left-[480px] top-[45px] sm:top-[55px] md:top-[65px] lg:top-[70px] text-sm sm:text-base text-gray-600 font-normal italic z-30" style={{ fontFamily: 'cursive' }}>
                Math²
              </div>

              {/* Bottom image - Two students in light gray frame */}
              <div className="absolute left-[260px] sm:left-[300px] md:left-[340px] lg:left-[360px] top-[180px] sm:top-[220px] md:top-[250px] lg:top-[280px] w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[120px] sm:h-[150px] md:h-[165px] lg:h-[180px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#e8e8e8' }}>
                <img src="/1.jpg" alt="student right bottom" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

