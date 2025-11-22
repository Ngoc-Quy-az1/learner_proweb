import { Check, X } from 'lucide-react'

interface PricingCardsProps {
  onContactClick?: () => void
}

export default function PricingCards({ onContactClick }: PricingCardsProps) {
  const pricingPlans = [
    {
      name: 'Basic',
      price: '$12',
      period: '/year',
      description: 'Học sinh cần kèm 1-1 môn chính (Toán, Anh...)',
      isPopular: false
    },
    {
      name: 'Premium',
      price: '$15',
      period: '/year',
      description: 'Học sinh trung bình khá, cần cải thiện + hỗ trợ môn yếu',
      isPopular: true
    },
    {
      name: 'Ultra',
      price: '$19',
      period: '/year',
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
          premium: '1 lần/tuần',
          ultra: '3 lần/tuần'
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
            className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight break-words flex-1 min-w-0">{plan.name}</h3>
              {plan.isPopular && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full text-green-700 flex-shrink-0" style={{ backgroundColor: '#90EE90' }}>
                  Popular
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{plan.price}</span>
              <span className="text-gray-600 ml-1 text-base sm:text-lg font-semibold">{plan.period}</span>
            </div>
            
            <div className="mb-6 flex flex-col">
              <p className="text-sm sm:text-base font-bold text-gray-800 mb-2">Phù hợp với học sinh nào:</p>
              <p className="text-sm sm:text-base font-semibold text-gray-700 leading-relaxed break-words">
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
        <div className="overflow-x-auto p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-[250px_1fr_1fr_1fr] gap-3 sm:gap-4 md:gap-6">
            {/* Empty first column for pricing cards row */}
            <div className="w-[250px]"></div>
            
            {/* Pricing Cards Row */}
            {pricingPlans.map((plan, index) => (
              <div
                key={`card-${index}`}
                className="bg-white rounded-xl p-3 sm:p-4 md:p-6 border-2 border-gray-200 flex flex-col min-w-0 h-full"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5 gap-2">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight break-words flex-1 min-w-0">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-green-700 flex-shrink-0" style={{ backgroundColor: '#90EE90' }}>
                      Popular
                    </span>
                  )}
                </div>
                
                <div className="mb-3 sm:mb-4 md:mb-5">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1 text-sm sm:text-base md:text-lg font-semibold">{plan.period}</span>
                </div>
                
                <div className="mb-4 sm:mb-6 md:mb-8 flex-grow flex flex-col">
                  <p className="text-xs sm:text-sm md:text-base font-bold text-gray-800 mb-1 sm:mb-2">Phù hợp với học sinh nào:</p>
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 leading-relaxed flex-grow break-words">
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
            ))}


            {/* Feature Comparison Table */}
            {features.map((category, catIndex) => (
              <>
                {/* Category Title Row */}
                <div key={`category-${catIndex}`} className="col-span-4 mt-6 sm:mt-8 first:mt-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-5 md:mb-6 break-words">{category.category}</h3>
                </div>
                
                {/* Table Header */}
                <div className="contents">
                  <div className="text-left font-extrabold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl pb-3 sm:pb-4 border-b-2 border-gray-300 w-[250px] break-words">Tiêu chí / Lợi ích</div>
                  <div className="text-center font-extrabold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl pb-3 sm:pb-4 border-b-2 border-gray-300 min-w-0 break-words">Basic</div>
                  <div className="text-center font-extrabold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl pb-3 sm:pb-4 border-b-2 border-gray-300 min-w-0 break-words">Premium</div>
                  <div className="text-center font-extrabold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl pb-3 sm:pb-4 border-b-2 border-gray-300 min-w-0 break-words">Ultra</div>
                </div>
                
                {/* Table Rows */}
                {category.items.map((item, itemIndex) => (
                  <>
                    <div key={`${catIndex}-${itemIndex}-name`} className="font-bold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg py-3 sm:py-4 md:py-5 border-b border-gray-200 w-[250px] leading-relaxed break-words">{item.name}</div>
                    <div key={`${catIndex}-${itemIndex}-basic`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-200 min-w-0">
                      {typeof item.basic === 'boolean' ? (
                        item.basic ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg font-bold break-words">{item.basic}</span>
                      )}
                    </div>
                    <div key={`${catIndex}-${itemIndex}-premium`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-200 min-w-0">
                      {typeof item.premium === 'boolean' ? (
                        item.premium ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg font-bold break-words">{item.premium}</span>
                      )}
                    </div>
                    <div key={`${catIndex}-${itemIndex}-ultra`} className="text-center py-3 sm:py-4 md:py-5 border-b border-gray-200 min-w-0">
                      {typeof item.ultra === 'boolean' ? (
                        item.ultra ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg font-bold break-words">{item.ultra}</span>
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
                    style={{ backgroundColor: '#63B8FF' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0"
                    style={{ backgroundColor: '#63B8FF' }}
                  >
                    Đăng ký ngay
                  </button>
                  <button
                    onClick={onContactClick}
                    className="py-2.5 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white min-w-0"
                    style={{ backgroundColor: '#63B8FF' }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Feature Comparison Table */}
      <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        {features.map((category, catIndex) => (
          <div key={catIndex} className={catIndex > 0 ? 'mt-8' : ''}>
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4 sm:mb-6 break-words">{category.category}</h3>
            
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 pb-3 border-b-2 border-gray-300">
                <div className="text-left font-bold text-gray-900 text-xs sm:text-sm break-words">Tiêu chí</div>
                <div className="text-center font-bold text-gray-900 text-xs sm:text-sm break-words">Basic</div>
                <div className="text-center font-bold text-gray-900 text-xs sm:text-sm break-words">Premium</div>
                <div className="text-center font-bold text-gray-900 text-xs sm:text-sm break-words">Ultra</div>
              </div>
              
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid grid-cols-4 gap-2 py-3 sm:py-4 border-b border-gray-200">
                  <div className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed break-words">{item.name}</div>
                  <div className="text-center">
                    {typeof item.basic === 'boolean' ? (
                      item.basic ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 text-xs sm:text-sm font-bold break-words">{item.basic}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof item.premium === 'boolean' ? (
                      item.premium ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 text-xs sm:text-sm font-bold break-words">{item.premium}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof item.ultra === 'boolean' ? (
                      item.ultra ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 text-xs sm:text-sm font-bold break-words">{item.ultra}</span>
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
