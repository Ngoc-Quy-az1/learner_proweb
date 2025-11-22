interface HeroSectionProps {
  onGetStarted?: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden py-12 lg:py-14" style={{ background: 'linear-gradient(135deg, #5A00FF 0%, #7B2BFF 100%)', minHeight: '70vh' }}>

      {/* Math Formulas and Geometric Shapes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Math formulas scattered across background */}
        <div className="absolute top-[8%] left-[5%] text-white opacity-10 text-2xl font-light transform -rotate-12">π = 3.14159...</div>
        <div className="absolute top-[15%] right-[8%] text-white opacity-10 text-xl font-light">a² + b² = c²</div>
        <div className="absolute top-[25%] left-[12%] text-white opacity-10 text-3xl font-light transform rotate-6">∫</div>
        <div className="absolute top-[35%] right-[15%] text-white opacity-10 text-2xl font-light">E = mc²</div>
        <div className="absolute top-[45%] left-[8%] text-white opacity-10 text-xl font-light transform -rotate-6">∑ x = n</div>
        <div className="absolute top-[55%] right-[20%] text-white opacity-10 text-2xl font-light">√(x² + y²)</div>
        <div className="absolute top-[65%] left-[15%] text-white opacity-10 text-xl font-light transform rotate-12">f(x) = x²</div>
        <div className="absolute top-[75%] right-[10%] text-white opacity-10 text-2xl font-light">α + β = γ</div>
        <div className="absolute top-[85%] left-[10%] text-white opacity-10 text-xl font-light transform -rotate-6">sin²θ + cos²θ = 1</div>
        
        {/* Middle area formulas */}
        <div className="absolute top-[20%] left-[35%] text-white opacity-10 text-xl font-light">dy/dx</div>
        <div className="absolute top-[40%] right-[35%] text-white opacity-10 text-2xl font-light transform rotate-6">∞</div>
        <div className="absolute top-[60%] left-[30%] text-white opacity-10 text-xl font-light">lim x→∞</div>
        <div className="absolute top-[30%] right-[40%] text-white opacity-10 text-2xl font-light transform -rotate-12">Σ</div>
        
        {/* Geometric shapes */}
        <div className="absolute top-[10%] left-[25%] text-white opacity-10 text-4xl">△</div>
        <div className="absolute top-[50%] right-[25%] text-white opacity-10 text-4xl transform rotate-45">□</div>
        <div className="absolute top-[70%] left-[20%] text-white opacity-10 text-4xl">○</div>
        <div className="absolute top-[28%] left-[48%] text-white opacity-10 text-3xl">◇</div>
        
        {/* Additional scattered formulas */}
        <div className="absolute top-[12%] right-[30%] text-white opacity-10 text-lg font-light">x = (-b ± √(b²-4ac))/2a</div>
        <div className="absolute top-[48%] left-[18%] text-white opacity-10 text-xl font-light">θ = 360°</div>
        <div className="absolute top-[82%] right-[18%] text-white opacity-10 text-xl font-light transform rotate-6">P(A∪B)</div>
      </div>

      {/* Dotted Yellow Border */}
      <div className="hidden sm:block absolute inset-6 sm:inset-8 lg:inset-12 xl:inset-16 border-2 border-yellow-400 border-dashed pointer-events-none rounded-2xl z-10"></div>


      <div className="relative w-full h-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-20 py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="flex flex-col lg:flex-row items-center h-full gap-6 lg:gap-10">

          {/* LEFT CONTENT */}
          <div className="text-white space-y-3 lg:space-y-4 xl:space-y-5 flex-shrink-0 w-full lg:max-w-[540px]">
            {/* Trusted Badge */}
            <p className="text-yellow-400 font-extrabold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
              Được tin tưởng bởi hơn 9000+ phụ huynh
            </p>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold leading-tight text-white" style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", fontWeight: 1000 }}>
              Tương Lai Tốt Đẹp Hơn<br />
              Cho Con Bạn.
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white/95 leading-relaxed">
              Nhận dạy kèm tại nhà được cá nhân hóa, được thiết kế để hướng dẫn con bạn đạt thành công trong kỳ thi,
              tăng cường sự tự tin và đạt điểm cao hơn ở trường.
            </p>


            {/* CTA Button */}
            <div className="pt-2 lg:pt-4">
              <button 
                onClick={onGetStarted}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 sm:px-8 md:px-10 lg:px-16 xl:px-20 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 rounded-xl font-bold text-sm sm:text-base lg:text-lg xl:text-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
              >
                Bắt đầu ngay
              </button>
            </div>
          </div>


          {/* RIGHT IMAGES */}
          <div className="relative flex justify-center lg:justify-end items-center flex-1 w-full lg:w-auto mt-8 lg:mt-0">
            <div className="relative lg:-ml-48 w-full max-w-[700px] h-[300px] sm:h-[380px] md:h-[420px] lg:h-[480px]">

              {/* GIRL - Confident (Left, Lower) */}
              <div className="absolute bottom-3 sm:bottom-6 left-0 w-[140px] sm:w-[200px] md:w-[260px] lg:w-[320px]">
                {/* Yellow frame background */}
                <div className="absolute -left-1 sm:-left-2 -top-1 sm:-top-2 w-full h-[calc(100%+0.5rem)] sm:h-[calc(100%+1rem)] bg-yellow-400 rounded-xl sm:rounded-2xl transform -rotate-2 shadow-2xl"></div>

                {/* Girl photo */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl w-full h-[180px] sm:h-[240px] md:h-[300px] lg:h-[380px]">
                  <img
                    src="/little-cute-boy-proud-when-he-finish-drawing-with-happiness-raised-two-hands-his-head-smile.jpg"
                    alt="Confident child"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Confident label with arrow */}
                <div className="absolute -top-8 sm:-top-12 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-yellow-400 text-gray-900 font-bold px-3 sm:px-4 md:px-5 py-1 sm:py-2 rounded-lg shadow-xl text-xs sm:text-sm whitespace-nowrap">
                    Tự tin
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full">
                    <div className="w-0 h-0 border-l-[6px] sm:border-l-[8px] border-r-[6px] sm:border-r-[8px] border-t-[6px] sm:border-t-[8px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -left-3 sm:-left-5 top-1/3 text-xl sm:text-2xl md:text-3xl z-20">⭐</div>
                <div className="absolute -right-3 sm:-right-5 top-8 sm:top-10 text-lg sm:text-xl md:text-2xl z-20" style={{ color: '#40E0D0' }}>✨</div>
              </div>



              {/* BOY - Brilliant (Right, Upper) */}
              <div className="absolute top-0 right-0 w-[140px] sm:w-[200px] md:w-[260px] lg:w-[320px]">
                {/* Turquoise frame background */}
                <div className="absolute -right-1 sm:-right-2 -top-1 sm:-top-2 w-full h-[calc(100%+0.5rem)] sm:h-[calc(100%+1rem)] rounded-xl sm:rounded-2xl transform rotate-2 shadow-2xl" style={{ backgroundColor: '#40E0D0' }}></div>

                {/* Boy photo */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl w-full h-[180px] sm:h-[240px] md:h-[300px] lg:h-[380px]">
                  <img
                    src="/boy-reading-book-sitting-table-classroom.jpg"
                    alt="Brilliant child"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Brilliant label with arrow */}
                <div className="absolute -bottom-8 sm:-bottom-12 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-[#40E0D0] text-white font-bold px-3 sm:px-4 md:px-5 py-1 sm:py-2 rounded-lg shadow-xl text-xs sm:text-sm whitespace-nowrap">
                    Xuất sắc
                  </div>
                  {/* Arrow pointing up */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full">
                    <div className="w-0 h-0 border-l-[6px] sm:border-l-[8px] border-r-[6px] sm:border-r-[8px] border-b-[6px] sm:border-b-[8px] border-l-transparent border-r-transparent" style={{ borderBottomColor: '#40E0D0' }}></div>
                  </div>
                </div>

                {/* A+ grade badge */}
                <div className="absolute -left-6 sm:-left-8 md:-left-10 top-12 sm:top-14 md:top-16 z-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 sm:border-3 md:border-4 flex items-center justify-center shadow-2xl" style={{ borderColor: '#5A00FF' }}>
                    <span className="text-sm sm:text-base md:text-lg font-bold" style={{ color: '#5A00FF' }}>A+</span>
                  </div>
                </div>

                {/* Crown icon */}
                <div className="absolute -right-4 sm:-right-6 md:-right-7 -top-1 sm:-top-2 z-20">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-xl" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l3-7 4 7 4-7 3 7M5 11v7h14v-7" />
                  </svg>
                </div>

                {/* Decorative elements */}
                <div className="absolute -left-3 sm:-left-5 bottom-12 sm:bottom-16 text-lg sm:text-xl md:text-2xl z-20" style={{ color: '#40E0D0' }}>✨</div>
                <div className="absolute -right-2 sm:-right-4 bottom-20 sm:bottom-24 text-lg sm:text-xl md:text-2xl z-20 text-yellow-300">⭐</div>
              </div>

            </div>
          </div>

      </div>
    </div>
  </section>
  )
}

