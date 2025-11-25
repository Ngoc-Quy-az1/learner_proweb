import { ChevronDown } from 'lucide-react'

interface PerformanceSectionProps {
  onGetStarted?: () => void
}

export default function PerformanceSection({ onGetStarted }: PerformanceSectionProps) {
  return (
    <section className="relative z-10 py-20 lg:py-32" style={{ backgroundColor: '#002769' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Title Section - Centered */}
        <div className="text-center mb-16">
          {/* Small Yellow Text */}
          <div className="mb-4">
            <span className="text-yellow-400 font-bold text-base tracking-wide" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
              Kết quả & Cam kết
            </span>
          </div>
          
          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-4xl mx-auto">
            Học sinh SKILLAR đạt kết quả cao hơn 3 lần trong lớp và các kỳ thi
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left Column - Chart */}
          <div className="flex justify-center lg:justify-start h-full">
            <div className="relative w-full px-2 sm:px-4 h-full">
              <img 
                src="/bd.jpg" 
                alt="Performance comparison chart showing Tuteria students perform 3x better" 
                className="w-full h-full object-cover object-top"
                style={{ maxWidth: '100%', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Right Column - Innovative Approach */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white mb-8 leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0px', wordSpacing: '0px', textRendering: 'optimizeLegibility', whiteSpace: 'normal', wordBreak: 'keep-all' }}>
              Phương pháp SKILLAR Focus™:
            </h3>
            
            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-lg">1</span>
                </div>
                <span className="text-white font-bold text-lg flex-1">Đánh giá khả năng tập trung & thói quen học tập</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-lg">2</span>
                </div>
                <span className="text-white font-bold text-lg flex-1">Thiết kế kế hoạch học theo chu kỳ tập trung</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-lg">3</span>
                </div>
                <span className="text-white font-bold text-lg flex-1">Kèm 1-1 – hướng dẫn hoàn thành từng bài tập</span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-lg">4</span>
                </div>
                <span className="text-white font-bold text-lg flex-1">Nhắc lịch thông minh và kiểm tra tiến độ</span>
              </div>

              {/* Item 5 */}
              <div className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-lg">5</span>
                </div>
                <span className="text-white font-bold text-lg flex-1">Báo cáo hàng tuần cho phụ huynh</span>
              </div>
            </div>
            
            <button 
              onClick={onGetStarted}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-8"
            >
              Bắt đầu ngay hôm nay
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

