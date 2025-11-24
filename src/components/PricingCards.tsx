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
      description: 'Phù hợp với học sinh hay quên bài, thiếu tập trung, cần hỗ trợ hoàn thiện bài tập về nhà, giữ kỷ luật học',
      isPopular: false
    },
    {
      name: 'Toàn diện',
      price: '3 buổi',
      period: '/tuần',
      description: 'Phù hợp với học sinh hay quên bài, thiếu tập trung, cần hỗ trợ hoàn thiện bài tập về nhà, giữ kỷ luật học + yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.',
      isPopular: true
    },
    {
      name: 'Chuyên sâu',
      price: '5 buổi',
      period: '/tuần',
      description: 'Phù hợp với học sinh hay quên bài, thiếu tập trung, cần hỗ trợ hoàn thiện bài tập về nhà, giữ kỷ luật học + mất gốc nhiều môn, hoặc đang thi chuyển cấp.',
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
    <div className="w-full max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile Pricing Cards - Display one by one */}
      <div className="md:hidden space-y-6 mb-8">
        {pricingPlans.map((plan, index) => (
          <div
            key={`mobile-card-${index}`}
            className={`bg-white rounded-xl p-4 sm:p-6 border-2 flex flex-col overflow-hidden relative ${index === 1 ? 'border-blue-500' : 'border-gray-200'}`}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute top-0 left-0 right-0 text-white text-center py-1.5 sm:py-2 rounded-t-xl font-bold text-xs sm:text-sm" style={{ fontWeight: 700, backgroundColor: '#21C3F9' }}>
                Phổ biến
              </div>
            )}
            <div className={`flex items-center justify-center gap-2 mb-4 flex-wrap ${plan.isPopular ? 'mt-8 sm:mt-10' : ''}`}>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight whitespace-nowrap" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.name}</h3>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 whitespace-nowrap" style={{ fontWeight: 900 }}>{plan.price}</span>
              <span className="text-gray-700 text-base sm:text-lg font-bold whitespace-nowrap">{plan.period}</span>
            </div>
            
            <div className="mb-6 flex flex-col">
              <p className="text-sm sm:text-base md:text-lg font-normal text-gray-700 leading-relaxed break-words">
                {plan.description.includes('+ yếu rõ 1–2 môn') ? (
                  <>
                    {plan.description.split('+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.')[0]}
                    <strong className="text-base sm:text-lg md:text-xl font-black text-gray-900" style={{ fontWeight: 900 }}>+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.</strong>
                  </>
                ) : plan.description.includes('+ mất gốc nhiều môn') ? (
                  <>
                    {plan.description.split('+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.')[0]}
                    <strong className="text-base sm:text-lg md:text-xl font-black text-gray-900" style={{ fontWeight: 900 }}>+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.</strong>
                  </>
                ) : (
                  plan.description
                )}
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
        <div className="p-6 sm:p-8 md:p-10 lg:p-12 relative">
          <div className="grid grid-cols-[300px_1fr_1fr_1fr] gap-6 sm:gap-8 md:gap-10 items-start">
            {/* Empty first column for pricing cards row */}
            <div className="w-[300px]"></div>
            
            {/* Pricing Cards Row */}
            {pricingPlans.map((plan, index) => (
              <div
                key={`card-${index}`}
                className={`relative flex ${!plan.isPopular ? 'mt-6 sm:mt-8 md:mt-10' : ''}`}
              >
                <div
                  className="bg-white rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-200 flex flex-col min-w-0 w-full overflow-hidden relative"
                >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 text-white text-center py-1.5 sm:py-2 md:py-2.5 rounded-t-xl font-bold text-xs sm:text-sm md:text-base z-10" style={{ fontWeight: 700, backgroundColor: '#21C3F9' }}>
                    Phổ biến
                  </div>
                )}
                {/* Title/Price section - fixed height and position for alignment */}
                <div className={`flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6 flex-wrap min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] ${plan.isPopular ? 'pt-8 sm:pt-9 md:pt-10' : 'pt-0'}`}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight whitespace-nowrap" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.name}</h3>
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 whitespace-nowrap" style={{ fontWeight: 900 }}>{plan.price}</span>
                  <span className="text-gray-700 text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap">{plan.period}</span>
                </div>
                
                {/* Description section - fixed height for alignment */}
                <div className="mb-6 sm:mb-8 md:mb-10 flex-grow flex flex-col min-h-[12rem] sm:min-h-[14rem] md:min-h-[16rem]">
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-700 leading-relaxed flex-grow break-words">
                    {plan.description.includes('+ yếu rõ 1–2 môn') ? (
                      <>
                        {plan.description.split('+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.')[0]}
                        <strong className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-gray-900" style={{ fontWeight: 900 }}>+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.</strong>
                      </>
                    ) : plan.description.includes('+ mất gốc nhiều môn') ? (
                      <>
                        {plan.description.split('+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.')[0]}
                        <strong className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-gray-900" style={{ fontWeight: 900 }}>+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.</strong>
                      </>
                    ) : (
                      plan.description
                    )}
                  </p>
                </div>
                
                {/* Button - fixed at bottom */}
                <button
                  onClick={onContactClick}
                  className="w-full py-3 sm:py-4 md:py-5 rounded-lg font-bold text-base sm:text-lg md:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white mt-auto"
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
                    <div className="w-[300px] h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                    <div className="h-6 sm:h-8 md:h-10"></div>
                  </div>
                )}
                {/* Table Header */}
                <div className="contents">
                  <div className="text-left font-black text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl pb-3 sm:pb-4 border-b-2 border-gray-400 w-[300px] break-words flex items-end min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5rem]" style={{ fontWeight: 900 }}>{category.category}</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words flex items-end justify-center min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5rem]" style={{ fontWeight: 900 }}>Cơ bản</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words flex items-end justify-center min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5rem]" style={{ fontWeight: 900 }}>Toàn diện</div>
                  <div className="text-center font-black text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-3 sm:pb-4 border-b-2 border-gray-400 min-w-0 break-words flex items-end justify-center min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5rem]" style={{ fontWeight: 900 }}>Chuyên sâu</div>
                </div>
                
                {/* Table Rows */}
                {category.items.map((item, itemIndex) => (
                  <div key={`${catIndex}-${itemIndex}`} className="contents">
                    <div className="font-black text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl pt-1.5 sm:pt-2 md:pt-2.5 pb-3 sm:pb-4 md:pb-5 border-b border-gray-300 w-[300px] leading-relaxed break-words flex items-start" style={{ fontWeight: 800 }}>{item.name}</div>
                    <div className="text-center pt-1.5 sm:pt-2 md:pt-2.5 pb-3 sm:pb-4 md:pb-5 border-b border-gray-300 min-w-0 flex items-center justify-center">
                      {typeof item.basic === 'boolean' ? (
                        item.basic ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.basic}</span>
                      )}
                    </div>
                    <div className="text-center pt-1.5 sm:pt-2 md:pt-2.5 pb-3 sm:pb-4 md:pb-5 border-b border-gray-300 min-w-0 flex items-center justify-center">
                      {typeof item.premium === 'boolean' ? (
                        item.premium ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.premium}</span>
                      )}
                    </div>
                    <div className="text-center pt-1.5 sm:pt-2 md:pt-2.5 pb-3 sm:pb-4 md:pb-5 border-b border-gray-300 min-w-0 flex items-center justify-center">
                      {typeof item.ultra === 'boolean' ? (
                        item.ultra ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-600" style={{ strokeWidth: 3 }} />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-600" style={{ strokeWidth: 3 }} />
                        )
                      ) : (
                        <span className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl font-black break-words" style={{ fontWeight: 800 }}>{item.ultra}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Action Buttons at bottom of each category */}
                <div className="col-span-4 grid grid-cols-[300px_1fr_1fr_1fr] gap-6 sm:gap-8 md:gap-10 mt-4 sm:mt-6">
                  <div className="w-[300px]"></div>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0 ml-2 sm:ml-2.5 md:ml-3"
                    style={{ backgroundColor: '#032757' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0 ml-2 sm:ml-2.5 md:ml-3"
                    style={{ backgroundColor: '#032757' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0 ml-2 sm:ml-2.5 md:ml-3"
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
            className="absolute rounded-3xl pointer-events-none z-10"
            style={{
              border: '16px solid #21C3F9',
              left: 'calc((300px + 1.5rem) + ((100% - 300px - 1.5rem * 4) / 3) + 1.5rem + 1.75rem)',
              width: 'calc((100% - 300px - 1.5rem * 4) / 3 - 1.5rem + 0.5rem)',
              top: '2.25rem',
              bottom: '9.5rem',
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
