import React, { useState, useEffect, useRef, memo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart2,
  PieChart,
  Shield,
  Smartphone,
  Menu,
  X,
  ChevronRight,
  Globe,
  Lock
} from "lucide-react";

/* -------------------------------- UTILS ---------------------------------- */
const cn = (...c) => c.filter(Boolean).join(" ");

/* ---------------------------- COMPONENTS --------------------------------- */

// 1. Navigation Bar
const Navbar = ({ isScrolled }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-[#080808]/80 backdrop-blur-md border-white/10 py-4"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <PieChart className="text-white h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">
            uwekezaji
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Security</a>
          <a href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
          >
            Login
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]">
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#080808] border-b border-white/10 p-4 flex flex-col gap-4 md:hidden">
          <a href="#features" className="text-gray-300 hover:text-white">Features</a>
          <a href="#security" className="text-gray-300 hover:text-white">Security</a>
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-left text-white font-medium"
          >
            Login
          </button>
          <button className="bg-indigo-600 text-white py-2 rounded-lg w-full">Sign Up</button>
        </div>
      )}
    </nav>
  );
};

// 2. Aurora Background Effect
const AuroraBackground = memo(() => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#080808]">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
    <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
    <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
    {/* Grid Overlay */}
    <div 
      className="absolute inset-0 opacity-[0.03]" 
      style={{
        backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} 
    />
  </div>
));

// 3. Feature Section (Alternating Layout)
const FeatureSection = ({ title, description, icon, imagePosition = "right", tags = [] }) => {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${imagePosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
          
          {/* Text Content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
              {icon}
              <span className="text-sm font-medium text-indigo-300">{tags[0]}</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1]">
              {title}
            </h2>
            
            <p className="text-lg text-gray-400 leading-relaxed">
              {description}
            </p>

            <button className="group flex items-center gap-2 text-white font-medium hover:text-indigo-400 transition-colors">
              Start now <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Visual/Image Placeholder */}
          <div className="flex-1 w-full">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm">
              {/* Abstract UI Mockup using CSS shapes */}
              <div className="absolute inset-0 bg-indigo-500/10 blur-[80px]" />
              <div className="relative h-full w-full bg-[#0f0f16] rounded-xl border border-white/5 shadow-2xl p-6 flex flex-col gap-4">
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-2 w-24 bg-white/20 rounded-full" />
                  <div className="h-6 w-6 rounded-full bg-white/10" />
                </div>
                {/* Mock Chart Area */}
                <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                   {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                     <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="w-full bg-gradient-to-t from-indigo-600/50 to-purple-500/50 rounded-t-sm"
                     />
                   ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// 4. Testimonial Card (Glass)
const TestimonialCard = ({ quote, author, role }) => (
  <div className="min-w-[300px] md:min-w-[400px] p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      ))}
    </div>
    <p className="text-lg text-gray-200 mb-6 font-light leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600" />
      <div>
        <div className="text-sm font-bold text-white">{author}</div>
        <div className="text-xs text-gray-400">{role}</div>
      </div>
    </div>
  </div>
);

/* ---------------------------- MAIN APP ----------------------------------- */
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);

  return (
    <div className="relative min-h-screen bg-[#080808] text-white font-sans selection:bg-indigo-500/30">
      <AuroraBackground />
      <Navbar isScrolled={scrolled} />

      {/* HERO SECTION */}
      <motion.header 
        className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 container mx-auto text-center"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-300">Now available on iOS and Android</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[1.1]">
            Your entire wealth. <br />
            One platform.
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Track your net worth, plan for retirement, and optimize your wealth with powerful analytics—all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-white border border-white/20 hover:bg-white/5 transition-all">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Abstract Hero Graphic */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="aspect-[16/9] bg-[#0f0f16] rounded-t-3xl border-t border-x border-white/10 shadow-2xl overflow-hidden relative">
             {/* Gradient overlay at bottom to blend */}
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent z-10" />
             
             {/* Mock Content Inside Hero */}
             <div className="p-8 grid grid-cols-3 gap-8 opacity-50">
                <div className="col-span-2 h-64 bg-white/5 rounded-xl animate-pulse" />
                <div className="col-span-1 h-64 bg-white/5 rounded-xl animate-pulse" />
                <div className="col-span-1 h-40 bg-white/5 rounded-xl" />
                <div className="col-span-2 h-40 bg-white/5 rounded-xl" />
             </div>
          </div>
        </motion.div>
      </motion.header>

      {/* SOCIAL PROOF */}
      <div className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY INVESTORS FROM</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Placeholder Logos using text/icons for demo */}
             {['Goldman', 'Morgan', 'Schwab', 'Fidelity', 'Vanguard'].map((name) => (
               <div key={name} className="flex items-center gap-2 text-xl font-bold font-display">
                 <Globe className="w-6 h-6" /> {name}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* FEATURES SECTIONS */}
      <div id="features">
        <FeatureSection 
          title="See your complete financial picture"
          description="Easily connect all your financial accounts—from brokerage platforms to bank accounts—via secure API integration with thousands of providers."
          icon={<Smartphone className="w-5 h-5 text-indigo-400" />}
          tags={["Easy Import"]}
          imagePosition="right"
        />

        <FeatureSection 
          title="Unlock deep portfolio insights"
          description="Unlock advanced investment analytics—asset allocation, historical performance, and AI-powered risk ratings. Know exactly how your portfolio is performing."
          icon={<BarChart2 className="w-5 h-5 text-purple-400" />}
          tags={["Advanced Analytics"]}
          imagePosition="left"
        />

        <FeatureSection 
          title="Maximum protection for your data"
          description="We only collect the information we absolutely need. With state-of-the-art encryption, no one can access your data – not even us."
          icon={<Shield className="w-5 h-5 text-green-400" />}
          tags={["Bank-Grade Security"]}
          imagePosition="right"
        />
      </div>

      {/* TESTIMONIALS */}
      <section className="py-24 overflow-hidden relative">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">What users love about Uwekezaji</h2>
          <div className="flex items-center justify-center gap-2 text-yellow-500">
             {[1,2,3,4,5].map(i => <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>)}
             <span className="text-white font-bold ml-2 text-lg">4.9/5 Rating</span>
          </div>
        </div>

        {/* Marquee Effect (Simulated) */}
        <div className="flex gap-6 animate-[scroll_40s_linear_infinite] w-max px-4">
           {[...Array(2)].map((_, idx) => (
             <React.Fragment key={idx}>
                <TestimonialCard 
                  quote="For the first time, I feel completely in control of my financial picture. It's not just a tool; it's a partner."
                  author="Jane Doe"
                  role="Tech Founder"
                />
                <TestimonialCard 
                  quote="The analytics are mind-blowing. I can finally see my true exposure across different sectors."
                  author="Marcus R."
                  role="Investment Banker"
                />
                <TestimonialCard 
                  quote="Beautiful UI, secure, and incredibly fast. Best portfolio tracker on the market."
                  author="Sarah L."
                  role="Crypto Investor"
                />
                 <TestimonialCard 
                  quote="I love the dividend tracking feature. It helps me plan my monthly cashflow perfectly."
                  author="David K."
                  role="Real Estate Mogul"
                />
             </React.Fragment>
           ))}
        </div>
      </section>

      {/* CTA / FOOTER */}
      <footer className="border-t border-white/10 bg-[#0f0f16] pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="text-indigo-500 h-6 w-6" />
                <span className="font-display text-xl font-bold text-white">uwekezaji</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                The premier platform for the discerning investor. Track stocks, bonds, and crypto in one unified view.
              </p>
              <div className="flex gap-4">
                 {/* Social Icons */}
                 <div className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors" />
                 <div className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors" />
                 <div className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div className="col-span-2">
               <h4 className="font-bold mb-6">Download App</h4>
               <div className="flex flex-col gap-3">
                 <button className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all text-left">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Smartphone size={16} /></div>
                    <div>
                       <div className="text-xs text-gray-400">Download on the</div>
                       <div className="text-sm font-bold">App Store</div>
                    </div>
                 </button>
                 <button className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all text-left">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Lock size={16} /></div>
                    <div>
                       <div className="text-xs text-gray-400">Get it on</div>
                       <div className="text-sm font-bold">Google Play</div>
                    </div>
                 </button>
               </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Uwekezaji Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}