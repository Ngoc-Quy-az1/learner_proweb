import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Phone, LogIn, Mail, Lock, Check, Play, ChevronRight, ChevronLeft } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      // Redirect based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'student' || user.role === 'parent') {
        navigate('/student')
      } else if (user.role === 'tutor') {
        navigate('/tutor')
      } else if (user.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const testimonials = [
    {
      text: "My daughter scored among the highest in her common entrance exam into a top school and got admitted the same day! It's been very gratifying to see her improve under her tutor, to the point where she now contends with the top students in class.",
      author: "Mrs. Soetan",
      location: "Lekki, Lagos"
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Deep Blue Background with Doodles - Using #0f43d4 */}
      <div className="fixed inset-0 z-0" style={{ background: 'linear-gradient(to bottom right, #0f43d4, #0a2f9e, #081f6b)' }}>
        {/* Mathematical and Scientific Doodles - Light Purple/White */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 text-4xl text-purple-200 font-mono">x² + y² = z²</div>
          <div className="absolute top-40 right-20 text-3xl text-purple-200 font-mono">8 = 3 + 5</div>
          <div className="absolute bottom-40 left-20 text-5xl text-purple-200">?</div>
          <div className="absolute top-60 left-1/3 text-4xl text-purple-200">△</div>
          <div className="absolute bottom-60 right-1/4 text-4xl text-purple-200">□</div>
          <div className="absolute top-1/3 right-10 text-3xl text-purple-200">DNA</div>
          <div className="absolute top-1/2 left-1/4 text-3xl text-purple-200">π</div>
          <div className="absolute bottom-1/3 left-1/3 text-4xl text-purple-200">∑</div>
                </div>
              </div>
              
      {/* Header/Navbar */}
      <nav className="relative z-50 bg-white border-b border-gray-200 sticky top-0">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Left Side - Bold and Prominent */}
            <div className="flex items-center flex-shrink-0">
              <Logo size="md" showTagline={false} taglineColor="black" />
            </div>

            {/* Center Section - Our Services & Search Bar */}
            <div className="hidden lg:flex items-center flex-1 justify-center ml-4 space-x-8">
              {/* Our Services - Dark Gray, Bold */}
              <div className="flex items-center space-x-1.5 text-gray-900 hover:text-blue-600 hover:bg-gray-100 cursor-pointer transition-all px-4 py-2 rounded-lg">
                <span className="font-bold text-base">Our Services</span>
                <ChevronDown className="w-4 h-4 text-gray-700" />
              </div>
              
              {/* Search Bar - Centered, Light Gray Background, Bo tròn hơn */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  className="w-full bg-gray-100 border border-gray-200 rounded-full pl-12 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right Section - Contact, Become Tutor, Login */}
            <div className="hidden md:flex items-center space-x-10 flex-shrink-0">
              {/* Contact Us - Dark Gray, Black Phone Icon */}
              <div className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 hover:bg-gray-100 cursor-pointer transition-all px-4 py-2 rounded-lg">
                <Phone className="w-5 h-5 text-black" />
                <span className="font-bold text-base">Contact Us</span>
              </div>

              {/* Become a Tutor - Dark Gray, Bold */}
              <button className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg">
                Become a Tutor
              </button>

              {/* Login - Dark Gray, Bold */}
              <button
                onClick={() => navigate('/login')}
                className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg"
              >
                Login
              </button>
                </div>
                
            {/* Mobile Menu Button */}
            <button className="md:hidden flex items-center justify-center w-10 h-10 text-gray-900 hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
                  </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
                    <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                      <input
                        type="text"
                placeholder="What do you want to learn?"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </nav>

        {/* Hero Section */}
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
          <div className="absolute inset-6 sm:inset-8 lg:inset-10 border-2 border-yellow-400 border-dashed pointer-events-none rounded-2xl z-10"></div>


          <div className="relative w-full h-full" style={{ padding: '2rem 2.5rem' }}>
            <div className="flex flex-col lg:flex-row items-center h-full gap-6 lg:gap-10">

              {/* LEFT CONTENT */}
              <div className="text-white space-y-3 lg:space-y-4 flex-shrink-0 pl-4 lg:pl-6" style={{ maxWidth: '540px' }}>
                {/* Trusted Badge */}
                <p className="text-yellow-400 font-extrabold text-base sm:text-lg tracking-wide" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                  Trusted by 9000+ Parents
                </p>

                {/* Main Title */}
                <h1 className="text-4rem sm:text-6xl md:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-white" style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", fontWeight: 1000 }}>
                  Better, Brighter<br />
                  Future For Your Kids.
                </h1>

                {/* Description */}
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-white/95 leading-relaxed max-w-lg">
                  Get personalized home tutoring that is designed to guide your children toward exam success,
                  boost their confidence, and get better school grades.
                </p>


                {/* CTA Button */}
                <div className="pt-2">
                  <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-10 sm:px-12 lg:px-14 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5">
                    Get Started
                  </button>
                </div>
              </div>


              {/* RIGHT IMAGES */}
              <div className="relative flex justify-center lg:justify-end items-center flex-1">
                <div className="relative lg:-ml-16" style={{ width: '520px', height: '360px' }}>

                  {/* GIRL - Confident (Left, Lower) */}
                  <div className="absolute bottom-6 left-0 w-[230px]">
                    {/* Yellow frame background */}
                    <div className="absolute -left-2 -top-2 w-[230px] h-[280px] bg-yellow-400 rounded-2xl transform -rotate-2 shadow-2xl"></div>

                    {/* Girl photo */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl w-[230px] h-[280px]">
                      <img
                        src="/little-cute-boy-proud-when-he-finish-drawing-with-happiness-raised-two-hands-his-head-smile.jpg"
                        alt="Confident child"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Confident label with arrow */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-yellow-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg shadow-xl text-xs whitespace-nowrap">
                        Confident
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full">
                        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -left-4 top-1/3 text-2xl z-20">⭐</div>
                    <div className="absolute -right-4 top-10 text-xl z-20" style={{ color: '#40E0D0' }}>✨</div>
                  </div>



                  {/* BOY - Brilliant (Right, Upper) */}
                  <div className="absolute top-0 right-0 w-[230px]">
                    {/* Turquoise frame background */}
                    <div className="absolute -right-2 -top-2 w-[230px] h-[280px] rounded-2xl transform rotate-2 shadow-2xl" style={{ backgroundColor: '#40E0D0' }}></div>

                    {/* Boy photo */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl w-[230px] h-[280px]">
                      <img
                        src="/boy-reading-book-sitting-table-classroom.jpg"
                        alt="Brilliant child"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Brilliant label with arrow */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-[#40E0D0] text-white font-bold px-4 py-1.5 rounded-lg shadow-xl text-xs whitespace-nowrap">
                        Brilliant
                      </div>
                      {/* Arrow pointing up */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full">
                        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent" style={{ borderBottomColor: '#40E0D0' }}></div>
                      </div>
                    </div>

                    {/* A+ grade badge */}
                    <div className="absolute -left-8 top-14 z-20">
                      <div className="w-12 h-12 bg-white rounded-full border-3 flex items-center justify-center shadow-2xl" style={{ borderColor: '#5A00FF', borderWidth: '3px' }}>
                        <span className="text-base font-bold" style={{ color: '#5A00FF' }}>A+</span>
                      </div>
                    </div>

                    {/* Crown icon */}
                    <div className="absolute -right-6 -top-2 z-20">
                      <svg className="w-10 h-10 text-white drop-shadow-xl" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l3-7 4 7 4-7 3 7M5 11v7h14v-7" />
                      </svg>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -left-4 bottom-14 text-xl z-20" style={{ color: '#40E0D0' }}>✨</div>
                    <div className="absolute -right-3 bottom-20 text-xl z-20 text-yellow-300">⭐</div>
                  </div>

                </div>
              </div>

          </div>
        </div>
      </section>


      {/* Section 2: Home Tutoring the Right Way */}
      <section className="relative z-10 bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 lg:space-y-8">
              {/* Small Yellow Text */}
              <div>
                <span className="text-yellow-500 font-semibold text-sm uppercase tracking-wide">
                  We do home tutoring the right way.
                </span>
              </div>
              
              {/* Main Title */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Make Tuteria your children's tutoring partner from cradle to ruling the world.
              </h2>
              
              {/* Description */}
              <p className="text-lg text-gray-700 leading-relaxed">
                We help your children excel at every stage of their learning journey—from building foundational skills in their early years to passing pivotal exams that shape their future. Our comprehensive approach ensures they're always ahead.
              </p>
              
              {/* Key Features */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg">Learn with the top 1% of vetted tutors</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg">We cover all classes, exams & curricula</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700 text-lg">Tutors come to your home or online</p>
            </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                  Get a professional tutor
                </button>
                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-semibold text-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                    <Play className="w-5 h-5 text-gray-700" />
            </div>
                  <span>Learn how it works</span>
                </button>
              </div>
            </div>

            {/* Right Column - Student Images Grid (custom layout like reference) */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-[460px] h-[360px]">
                {/* Left tall frame */}
                <div className="absolute left-0 bottom-0 w-[120px] h-[300px] rounded-2xl bg-yellow-400 transform -rotate-1 shadow-2xl"></div>
                <div className="absolute left-4 bottom-4 w-[120px] h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/4.jpg" alt="graduate" className="w-full h-full object-cover" />
                </div>

                {/* Middle tall frame */}
                <div className="absolute left-[140px] top-0 w-[140px] h-[320px] rounded-2xl bg-[#244e59] overflow-hidden shadow-2xl">
                  <img src="/2.jpg" alt="student middle" className="w-full h-full object-cover" />
                </div>

                {/* Right top tall frame */}
                <div className="absolute right-0 top-6 w-[120px] h-[220px] rounded-2xl bg-[#67d7d2] overflow-hidden shadow-2xl">
                  <img src="/3.jpg" alt="student right top" className="w-full h-full object-cover" />
                </div>

                {/* Bottom middle small frame */}
                <div className="absolute left-[160px] bottom-12 w-[110px] h-[140px] rounded-2xl bg-[#ff8a65] overflow-hidden shadow-2xl">
                  <img src="/5.jpg" alt="student bottom middle" className="w-full h-full object-cover" />
                </div>

                {/* Bottom right small frame */}
                <div className="absolute right-4 bottom-12 w-[110px] h-[140px] rounded-2xl bg-[#e0ad2f] overflow-hidden shadow-2xl">
                  <img src="/1.jpg" alt="student bottom right" className="w-full h-full object-cover" />
                </div>

                {/* Decorative A+ */}
                <div className="absolute left-28 top-4 z-20">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md" style={{ border: '2px solid #f5c25a' }}>
                    <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>A+</span>
                  </div>
                </div>
                {/* Optional small note like 'Math' above right top */}
                <div className="absolute right-10 top-0 text-xs text-white/90 font-semibold" style={{ transform: 'translateY(-22px)' }}>Math</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Performance Results */}
      <section className="relative z-10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Chart and Title */}
            <div className="space-y-8">
              {/* Small Yellow Text */}
              <div>
                <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
                  We deliver the best results, period.
                </span>
              </div>
              
              {/* Main Title */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
                Tuteria students perform 3x better in class and school exams
            </h2>
              
              {/* Comparison Chart */}
              <div className="space-y-6 pt-8">
                <div className="flex items-end space-x-8">
                  {/* School Only Bar */}
                  <div className="flex-1 space-y-2">
                    <div className="bg-white/20 h-24 rounded-t-lg flex items-end">
                      <div className="w-full bg-white h-16 rounded-t-lg"></div>
                    </div>
                    <p className="text-white text-center font-medium">School only</p>
                  </div>
                  
                  {/* Tuteria Tutoring Bar */}
                  <div className="flex-1 space-y-2 relative">
                    <div className="absolute -left-8 top-0 flex flex-col items-center">
                      <div className="text-yellow-400 text-2xl font-bold">3x growth</div>
                      <div className="text-yellow-400 text-3xl">↑</div>
                    </div>
                    <div className="bg-white/20 h-24 rounded-t-lg flex items-end">
                      <div className="w-full bg-gradient-to-t from-yellow-400 to-white h-full rounded-t-lg"></div>
                    </div>
                    <p className="text-white text-center font-medium">Tuteria Tutoring</p>
                  </div>
                </div>
              </div>
          </div>

            {/* Right Column - Innovative Approach */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                Our Innovative Approach Ensures Your Child Achieves Stellar Results
              </h3>
              
              <div className="space-y-4">
                {[
                  "Tuteria Insights™ Assessment",
                  "Adaptive Learning Plans",
                  "Child-Centered Learning",
                  "Periodic Evaluation",
                  "Progress Reports & Reviews"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-bold text-lg">{idx + 1}.</span>
                      <span className="text-white font-medium">{item}</span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-6">
                Get started today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Testimonials */}
      <section className="relative z-10 bg-gray-100 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8">
              Parents love Tuteria
            </h2>
          </div>
          
          {/* Testimonial Card */}
          <div className="relative bg-white rounded-2xl p-8 lg:p-12 shadow-xl">
            {/* Quote Icon */}
            <div className="absolute top-4 left-4 text-6xl text-gray-300 font-serif">"</div>
            
            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Testimonial Content */}
            <div className="relative z-10">
              <p className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-6 pl-8">
                {testimonials[currentTestimonial].text}
              </p>
              
              {/* Rating Stars */}
              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-2xl">★</span>
                ))}
              </div>

              {/* Author Info */}
              <div className="text-gray-600">
                <p className="font-semibold text-lg">{testimonials[currentTestimonial].author}</p>
                <p className="text-sm">{testimonials[currentTestimonial].location}</p>
              </div>
            </div>
            
            {/* Pagination Dots */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentTestimonial ? 'bg-gray-900' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo size="sm" showTagline={true} taglineColor="white" />
              </div>
              <p className="text-gray-400">Where Growth Begins</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Liên kết nhanh</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-white transition-colors">Đăng nhập</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">© 2024 SKILLAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
