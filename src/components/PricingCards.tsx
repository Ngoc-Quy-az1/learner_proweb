import { Check, X } from 'lucide-react'

interface PricingCardsProps {
  onContactClick?: () => void
}

export default function PricingCards({ onContactClick }: PricingCardsProps) {
  const pricingPlans = [
    {
      name: 'Cơ bản',
      price: '2 buổi',
      period: '/tuần',
      description: 'Học sinh cần kèm 1-1 môn chính (Toán, Anh...)',
      isPopular: false
    },
    {
      name: 'Toàn diện',
      price: '3 buổi',
      period: '/tuần',
      description: 'Học sinh trung bình khá, cần cải thiện + hỗ trợ môn yếu',
      isPopular: true
    },
    {
      name: 'Chuyên sâu',
      price: '5 buổi',
      period: '/tuần',
      description: 'Học sinh yếu/học lực cần cải thiện toàn diện, nhiều môn',
      isPopular: false
    }
  ]

  const features = [
    {
      category: 'Tiêu chí / Lợi ích',
      items: [
        {
          name: 'Tutor kèm chính (1-1)',
          basic: '2 buổi/tuần',
          premium: '2 buổi/tuần',
          ultra: '3 buổi/tuần'
        },
        {
          name: 'GV bộ môn kèm môn yếu',
          basic: false,
          premium: '1 buổi/tuần',
          ultra: '2 buổi/tuần'
        },
        {
          name: 'GV bộ môn chữa bài qua ảnh (không giới hạn)',
          basic: true,
          premium: true,
          ultra: true
        },
        {
          name: 'GV bộ môn gửi video chữa bài chi tiết',
          basic: false,
          premium: '3 lần/tuần',
          ultra: '5 lần/tuần'
        },
        {
          name: 'Báo cáo học tập cuối mỗi buổi',
          basic: true,
          premium: true,
          ultra: true
        },
        {
          name: 'Nộp bài: Upload ảnh / file, nhận xét trực tiếp',
          basic: true,
          premium: true,
          ultra: true
        },
        {
          name: 'Giao thêm bài tập bổ sung cá nhân hóa',
          basic: 'Theo yêu cầu',
          premium: 'Có đề luyện riêng',
          ultra: 'Lộ trình học riêng + chi tiết'
        }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile Pricing Cards - Display one by one */}
      <div className="md:hidden space-y-6 mb-8">
        {pricingPlans.map((plan, index) => (
          <div
            key={`mobile-card-${index}`}
            className={`bg-white rounded-xl p-4 sm:p-6 border-2 flex flex-col overflow-hidden ${index === 1 ? 'border-blue-500' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight whitespace-nowrap" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.name}</h3>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 whitespace-nowrap" style={{ fontWeight: 900 }}>{plan.price}</span>
              <span className="text-gray-700 text-base sm:text-lg font-bold whitespace-nowrap">{plan.period}</span>
            </div>
            
            <div className="mb-6 flex flex-col">
              <p className="text-base sm:text-lg font-black text-gray-900 mb-2" style={{ fontWeight: 900 }}>Phù hợp với học sinh nào:</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800 leading-relaxed break-words" style={{ fontWeight: 700 }}>
                {plan.description}
              </p>
            </div>
            
            <button
              onClick={onContactClick}
              className="w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: '#63B8FF' }}
            >
              Đăng ký ngay
            </button>
          </div>
        ))}
      </div>

      {/* Combined Pricing Cards and Table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="overflow-x-auto p-3 sm:p-4 md:p-6 relative">
          <div className="grid grid-cols-[250px_1fr_1fr_1fr] gap-3 sm:gap-4 md:gap-6">
            {/* Empty first column for pricing cards row */}
            <div className="w-[250px]"></div>
            
            {/* Pricing Cards Row */}
            {pricingPlans.map((plan, index) => (
              <div
                key={`card-${index}`}
                className="relative"
              >
                <div
                  className="bg-white rounded-xl p-3 sm:p-4 md:p-6 border-2 border-gray-200 flex flex-col min-w-0 h-full overflow-hidden"
                >
                <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 md:mb-5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight whitespace-nowrap" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.name}</h3>
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 whitespace-nowrap" style={{ fontWeight: 900 }}>{plan.price}</span>
                  <span className="text-gray-700 text-base sm:text-lg md:text-xl font-bold whitespace-nowrap">{plan.period}</span>
                </div>
                
                <div className="mb-4 sm:mb-6 md:mb-8 flex-grow flex flex-col">
                  <p className="text-sm sm:text-base md:text-lg font-black text-gray-900 mb-1 sm:mb-2" style={{ fontWeight: 900 }}>Phù hợp với học sinh nào:</p>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-800 leading-relaxed flex-grow break-words" style={{ fontWeight: 700 }}>
                    {plan.description}
                  </p>
                </div>
                
                <button
                  onClick={onContactClick}
                  className="w-full py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white mt-auto"
                  style={{ backgroundColor: '#63B8FF' }}
                >
                  Đăng ký ngay
                </button>
                </div>
              </div>
            ))}


            {/* Feature Comparison Table */}
            {features.map((category, catIndex) => (
              <>
                {/* Spacer row for spacing after pricing cards */}
                {catIndex === 0 && (
                  <div className="contents">
                    <div className="w-[250px] h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                  </div>
                )}
                {/* Table Header */}
                <div className="contents">
                  <div className="text-left font-black text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl pb-3 sm:pb-4 border-b-2 border-gray-400 w-[250px] break-words" style={{ fontWeight: 900 }}>{category.category}</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words" style={{ fontWeight: 900 }}>Cơ bản</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words" style={{ fontWeight: 900 }}>Toàn diện</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words" style={{ fontWeight: 900 }}>Chuyên sâu</div>
                </div>
                
                {/* Table Rows */}
                {category.items.map((item, itemIndex) => (
                  <>
                    <div key={`${catIndex}-${itemIndex}-name`} className="font-black text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl py-3 sm:py-4 md:py-5 border-b border-gray-300 w-[250px] leading-relaxed break-words" style={{ fontWeight: 800 }}>{item.name}</div>
                    <div key={`${catIndex}-${itemIndex}-basic`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-300 min-w-0">
                      {typeof item.basic === 'boolean' ? (
                        item.basic ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.basic}</span>
                      )}
                    </div>
                    <div key={`${catIndex}-${itemIndex}-premium`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-300 min-w-0">
                      {typeof item.premium === 'boolean' ? (
                        item.premium ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.premium}</span>
                      )}
                    </div>
                    <div key={`${catIndex}-${itemIndex}-ultra`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-300 min-w-0">
                      {typeof item.ultra === 'boolean' ? (
                        item.ultra ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.ultra}</span>
                      )}
                    </div>
                  </>
                ))}
                
                {/* Action Buttons at bottom of each category */}
                <div className="col-span-4 grid grid-cols-[250px_1fr_1fr_1fr] gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                  <div className="w-[250px]"></div>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0"
                    style={{ backgroundColor: '#032757' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0"
                    style={{ backgroundColor: '#032757' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0"
                    style={{ backgroundColor: '#032757' }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </>
            ))}
          </div>
          {/* Blue border frame for Toàn diện column - spans entire column */}
          <div 
            className="absolute border-2 border-blue-500 rounded-lg pointer-events-none z-10"
            style={{
              left: 'calc((250px + 0.75rem) + ((100% - 250px - 0.75rem * 4) / 3) + 0.75rem + 0.25rem)',
              width: 'calc((100% - 250px - 0.75rem * 4) / 3 - 0.75rem + 0.5rem)',
              top: '0',
              bottom: 'calc(0.75rem + 3.5rem + 0.75rem + 1rem)',
            }}
          ></div>
        </div>
      </div>

      {/* Mobile Feature Comparison Table */}
      <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        {features.map((category, catIndex) => (
          <div key={catIndex} className={catIndex > 0 ? 'mt-8' : ''}>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6 break-words" style={{ fontWeight: 900 }}>{category.category}</h3>
            
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 pb-3 border-b-2 border-gray-400">
                <div className="text-left font-black text-gray-900 text-sm sm:text-base break-words" style={{ fontWeight: 900 }}>Tiêu chí / Lợi ích</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: 900 }}>Cơ bản</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: 900 }}>Toàn diện</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: 900 }}>Chuyên sâu</div>
              </div>
              
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid grid-cols-4 gap-2 py-3 sm:py-4 border-b border-gray-300">
                  <div className="font-black text-gray-900 text-sm sm:text-base leading-relaxed break-words" style={{ fontWeight: 800 }}>{item.name}</div>
                  <div className="text-center">
                    {typeof item.basic === 'boolean' ? (
                      item.basic ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                      )
                    ) : (
                      <span className="text-gray-900 text-sm sm:text-base font-black break-words" style={{ fontWeight: 800 }}>{item.basic}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof item.premium === 'boolean' ? (
                      item.premium ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                      )
                    ) : (
                      <span className="text-gray-900 text-sm sm:text-base font-black break-words" style={{ fontWeight: 800 }}>{item.premium}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof item.ultra === 'boolean' ? (
                      item.ultra ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto" style={{ strokeWidth: 3 }} />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto" style={{ strokeWidth: 3 }} />
                      )
                    ) : (
                      <span className="text-gray-900 text-sm sm:text-base font-black break-words" style={{ fontWeight: 800 }}>{item.ultra}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
