import React from 'react'
import { Check, X } from 'lucide-react'

// Constants for styling to ensure consistency across the component
const POPULAR_COLOR = '#21C3F9' // Blue color for "Phổ biến"
const FEATURE_TEXT_COLOR = 'text-gray-900'
const FONT_WEIGHT_BLACK = 900
const FONT_WEIGHT_BOLD = 800

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

  /**
   * Helper function to render the feature value (Check/X/Text)
   */
  const renderFeatureValue = (value: boolean | string) => {
    const iconClass = `w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8`
    const textClass = `${FEATURE_TEXT_COLOR} text-sm sm:text-base md:text-lg lg:text-xl font-black break-words`
    
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`${iconClass} text-green-600`} style={{ strokeWidth: 3 }} />
      ) : (
        <X className={`${iconClass} text-red-600`} style={{ strokeWidth: 3 }} />
      )
    }
    return <span className={textClass} style={{ fontWeight: FONT_WEIGHT_BOLD }}>{value}</span>
  }

  /**
   * Helper function to render the description with highlighted strong parts
   */
  const renderDescription = (description: string) => {
    if (description.includes('+ yếu rõ 1–2 môn')) {
      const parts = description.split('+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.')
      return (
        <>
          {parts[0]}
          <strong className="text-base sm:text-lg md:text-xl font-black text-gray-900" style={{ fontWeight: FONT_WEIGHT_BLACK }}>+ yếu rõ 1–2 môn, cần giải thích sâu và cải thiện điểm.</strong>
        </>
      )
    }
    if (description.includes('+ mất gốc nhiều môn')) {
      const parts = description.split('+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.')
      return (
        <>
          {parts[0]}
          <strong className="text-base sm:text-lg md:text-xl font-black text-gray-900" style={{ fontWeight: FONT_WEIGHT_BLACK }}>+ mất gốc nhiều môn, hoặc đang thi chuyển cấp.</strong>
        </>
      )
    }
    return description
  }

  return (
    <div className="w-full max-w-[95%] xl:max-w-[90%] mx-auto p-4 sm:p-6 lg:p-8 font-inter">
      {/* 1. Mobile Pricing Cards - Display one by one */}
      <div className="md:hidden space-y-8 mb-12">
        {pricingPlans.map((plan, index) => (
          <div
            key={`mobile-card-${index}`}
            className={`bg-white rounded-xl p-6 sm:p-8 border-4 flex flex-col shadow-xl overflow-hidden relative transition-all duration-300 ${plan.isPopular ? 'transform scale-[1.02]' : 'border-gray-200'}`}
            style={plan.isPopular ? { borderColor: '#21C3F9' } : {}}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute top-0 left-0 right-0 text-white text-center py-2 rounded-t-lg font-bold text-sm sm:text-base tracking-wider" style={{ fontWeight: FONT_WEIGHT_BLACK, backgroundColor: POPULAR_COLOR }}>
                Phổ biến
              </div>
            )}
            
            <div className={`flex flex-col items-center justify-center gap-1 mb-5 ${plan.isPopular ? 'mt-8 sm:mt-10' : ''}`}>
              <h3 className={`text-3xl sm:text-4xl font-black ${FEATURE_TEXT_COLOR}`} style={{ fontWeight: FONT_WEIGHT_BLACK, letterSpacing: '-0.03em' }}>{plan.name}</h3>
              <div className='flex items-end gap-2'>
                <span className={`text-4xl sm:text-5xl font-black ${FEATURE_TEXT_COLOR}`} style={{ fontWeight: FONT_WEIGHT_BLACK }}>{plan.price}</span>
                <span className="text-gray-700 text-lg sm:text-xl font-bold">{plan.period}</span>
              </div>
            </div>
            
            <div className="mb-8 text-center" style={{ minHeight: plan.isPopular ? '6rem' : '5rem' }}>
              <p className="text-base sm:text-lg font-normal text-gray-700 leading-relaxed">
                {renderDescription(plan.description)}
              </p>
            </div>
            
            <button
              onClick={onContactClick}
              className="w-full py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white shadow-lg"
              style={{ backgroundColor: plan.isPopular ? '#21C3F9' : '#032757' }}
            >
              Đăng ký ngay
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Feature Comparison Table */}
      <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mt-8">
        {features.map((category, catIndex) => (
          <div key={catIndex} className={catIndex > 0 ? 'mt-8' : ''}>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 break-words" style={{ fontWeight: FONT_WEIGHT_BLACK }}>{category.category}</h3>
            
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 sm:gap-4 pb-3 border-b-2 border-gray-400 min-w-[600px]">
                <div className="text-left font-black text-gray-900 text-sm sm:text-base break-words sticky left-0 z-10 bg-white pr-2" style={{ fontWeight: FONT_WEIGHT_BLACK }}>Tiêu chí / Lợi ích</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: FONT_WEIGHT_BLACK }}>Cơ bản</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: FONT_WEIGHT_BLACK }}>Toàn diện</div>
                <div className="text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl break-words" style={{ fontWeight: FONT_WEIGHT_BLACK }}>Chuyên sâu</div>
              </div>
              
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="group grid grid-cols-4 gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-300 min-w-[600px]">
                  <div className="font-black text-gray-900 text-sm sm:text-base leading-relaxed break-words sticky left-0 z-10 bg-white group-hover:bg-white pr-2" style={{ fontWeight: FONT_WEIGHT_BOLD }}>{item.name}</div>
                  <div className="text-center flex items-center justify-center">
                    {renderFeatureValue(item.basic)}
                  </div>
                  <div className="text-center flex items-center justify-center bg-blue-50">
                    {renderFeatureValue(item.premium)}
                  </div>
                  <div className="text-center flex items-center justify-center">
                    {renderFeatureValue(item.ultra)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Combined Pricing Cards and Table - Desktop (md and up) */}
      <div className="hidden md:block bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
        <div className="pt-8 pb-6 px-4 sm:pt-10 sm:pb-8 sm:px-6 md:pt-12 md:pb-8 md:px-8 lg:pt-16 lg:pb-12 lg:px-12 relative">

          {/* Pricing Cards Row and Feature Column Titles */}
          {/* Using custom grid template for the 4 columns: Wide feature column, 3 equal plan columns */}
          <div 
            className="grid items-stretch" 
            style={{ 
              gridTemplateColumns: `minmax(200px, 250px) 1fr 1fr 1fr`,
              gap: 'clamp(0.75rem, 2vw, 1.5rem)'
            }}
          >
            {/* Empty first column space */}
            <div></div>
            
            {/* Pricing Cards */}
            {pricingPlans.map((plan, index) => {
              const isPopular = plan.isPopular
              // Apply distinct styling for the popular column
              const cardClass = isPopular 
                ? 'border-8 bg-blue-500/10 shadow-xl z-20' 
                : 'border-2 border-gray-200 bg-white shadow-md'

              return (
                <div key={`card-${index}`} className="relative flex h-full">
                  <div className={`rounded-2xl flex flex-col min-w-0 w-full h-full overflow-hidden transition-all duration-300 ${cardClass}`} style={
                    isPopular 
                      ? { borderColor: '#21C3F9', padding: 'clamp(0.5rem, 1.5vw, 1.5rem) clamp(0.5rem, 1.5vw, 2rem)' } 
                      : index === 0 
                        ? { padding: 'clamp(0.375rem, 1vw, 0.75rem) clamp(0.375rem, 1vw, 1.25rem)' }
                        : { padding: 'clamp(0.5rem, 1.25vw, 1rem) clamp(0.5rem, 1.25vw, 1.5rem)' }
                  }>
                    
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-8 left-0 right-0 text-white text-center py-1.5 sm:py-2 rounded-t-xl font-black text-base sm:text-lg md:text-xl lg:text-2xl z-10" style={{ fontWeight: FONT_WEIGHT_BLACK, backgroundColor: POPULAR_COLOR }}>
                        Phổ biến
                      </div>
                    )}

                    {/* Title/Price section - Fixed height for vertical alignment */}
                    <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3" style={{ minHeight: 'clamp(80px, 8vw, 120px)', paddingTop: isPopular ? 'clamp(1.25rem, 2.5vw, 1.75rem)' : 'clamp(2.5rem, 4vw, 3.5rem)' }}>
                      <h3 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black ${FEATURE_TEXT_COLOR}`} style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.name}</h3>
                      <div className="flex items-end justify-center gap-1.5 sm:gap-2">
                        <span className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black ${FEATURE_TEXT_COLOR}`} style={{ fontWeight: FONT_WEIGHT_BLACK }}>{plan.price}</span>
                        <span className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl font-bold">{plan.period}</span>
                      </div>
                    </div>
                    
                    {/* Description section - Fixed height for vertical alignment */}
                    <div className="mb-2 sm:mb-3 flex-grow flex flex-col" style={{ minHeight: 'clamp(100px, 12vw, 160px)' }}>
                      <p className="text-xs sm:text-sm md:text-base lg:text-lg font-normal text-gray-700 leading-relaxed flex-grow break-words text-center">
                        {renderDescription(plan.description)}
                      </p>
                    </div>
                    
                    {/* Button - fixed at bottom */}
                    <button
                      onClick={onContactClick}
                      className={`w-full py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-xl font-bold text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:opacity-90 text-white shadow-lg mt-auto`}
                      style={{ backgroundColor: isPopular ? '#21C3F9' : '#032757' }}
                    >
                      Đăng ký ngay
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className='mt-12 lg:mt-16 overflow-x-auto'>
            <div className="min-w-full">
              {features.map((category, catIndex) => (
                <React.Fragment key={catIndex}>
                  
                  {/* Table Header Row (Plan Names, fixed height for alignment) */}
                  <div 
                    className="grid border-b-2 border-gray-400 mb-4" 
                    style={{ 
                      gridTemplateColumns: `minmax(200px, 250px) 1fr 1fr 1fr`,
                      gap: 'clamp(0.75rem, 2vw, 1.5rem)'
                    }}
                  >
                    {/* Category Title Cell */}
                    <div className={`text-left font-black ${FEATURE_TEXT_COLOR} text-sm sm:text-base md:text-lg lg:text-xl py-2 sm:py-3 break-words flex items-end justify-start sticky left-0 z-10 bg-white pr-4`} style={{ fontWeight: FONT_WEIGHT_BLACK }}>
                      {category.category}
                    </div>
                    
                    {/* Plan Name Cells */}
                    <div className='text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl lg:text-3xl py-2 sm:py-3 break-words flex items-end justify-center' style={{ fontWeight: FONT_WEIGHT_BLACK }}>Cơ bản</div>
                    <div className='text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl lg:text-3xl py-2 sm:py-3 break-words flex items-end justify-center' style={{ fontWeight: FONT_WEIGHT_BLACK }}>Toàn diện</div>
                    <div className='text-center font-black text-gray-900 text-lg sm:text-xl md:text-2xl lg:text-3xl py-2 sm:py-3 break-words flex items-end justify-center' style={{ fontWeight: FONT_WEIGHT_BLACK }}>Chuyên sâu</div>
                  </div>
                  
                  {/* Table Content Rows */}
                  {category.items.map((item, itemIndex) => {
                    const items = [item.basic, item.premium, item.ultra]
                    return (
                      <div 
                        key={`${catIndex}-${itemIndex}`} 
                        className="group grid py-3 sm:py-4 border-b border-gray-300 transition-all duration-100 hover:bg-gray-50/50" 
                        style={{ 
                          gridTemplateColumns: `minmax(200px, 250px) 1fr 1fr 1fr`,
                          gap: 'clamp(0.75rem, 2vw, 1.5rem)'
                        }}
                      >
                        {/* Feature Name */}
                        <div className={`font-black ${FEATURE_TEXT_COLOR} text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed break-words flex items-center sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 pr-4 transition-colors`} style={{ fontWeight: FONT_WEIGHT_BOLD }}>
                          {item.name}
                        </div>
                        
                        {/* Plan Feature Values */}
                        {items.map((value, planIndex) => {
                          const isPopular = planIndex === 1
                          const cellClass = isPopular ? 'bg-blue-50' : 'bg-transparent'
                          
                          return (
                            <div key={planIndex} className={`text-center py-3 flex items-center justify-center ${cellClass}`}>
                              {renderFeatureValue(value)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Action Buttons at bottom of feature comparison */}
          <div 
            className="grid mt-8 sm:mt-10 md:mt-12 pt-4 sm:pt-5 md:pt-6"
            style={{ 
              gridTemplateColumns: `minmax(200px, 250px) 1fr 1fr 1fr`,
              gap: 'clamp(0.75rem, 2vw, 1.5rem)'
            }}
          >
            <div></div> {/* Spacer */}
            
            {pricingPlans.map((plan, index) => (
              <button
                key={`btn-bottom-${index}`}
                onClick={onContactClick}
                className="py-3 lg:py-4 rounded-xl font-bold text-base lg:text-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 text-white shadow-md"
                style={{ backgroundColor: plan.isPopular ? '#21C3F9' : '#032757' }}
              >
                Đăng ký ngay
              </button>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}