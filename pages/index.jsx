"use client";
import React, { memo } from "react";
import Link from "next/link";
import { UwekezajiLogo } from "@/components/layout/UwekezajiLogo";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, Shield, Smartphone, ChevronRight, TrendingUp, Zap, Globe } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

/* ─── Shared micro-components ────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999999] mb-3">{children}</p>
);

const Card = ({ className, children, hover = true }) => (
  <div className={cn(
    "bg-white rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-6",
    hover && "hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] transition-shadow",
    className
  )}>
    {children}
  </div>
);

/* ─── Feature card ───────────────────────────────────────────────────────── */
const FeatureCard = ({ icon, tag, title, description }) => (
  <Card>
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#F3F3F3] mb-5">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#555555]">{tag}</span>
    </div>
    <h3 className="text-[18px] font-extrabold tracking-[-0.04em] text-black leading-snug mb-2">{title}</h3>
    <p className="text-[13px] text-[#555555] font-medium leading-relaxed">{description}</p>
    <Link href="/signup" className="inline-flex items-center gap-1.5 text-[#0054CB] text-[12px] font-bold mt-4 hover:underline">
      Get started <ChevronRight size={13} />
    </Link>
  </Card>
);

/* ─── Stat card ──────────────────────────────────────────────────────────── */
const StatCard = ({ value, label, icon }) => (
  <Card className="flex flex-col gap-3">
    <div className="w-8 h-8 rounded-[8px] bg-[#F3F3F3] flex items-center justify-center text-[#555555]">
      {icon}
    </div>
    <div className="text-[28px] font-extrabold tracking-[-0.05em] text-black leading-none">{value}</div>
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999999]">{label}</p>
  </Card>
);

/* ─── Testimonial card ───────────────────────────────────────────────────── */
const TestimonialCard = ({ quote, author, role }) => (
  <div className="min-w-[300px] md:min-w-[360px] bg-white rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-6">
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-black fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <p className="text-[14px] text-black font-medium leading-relaxed mb-5">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#F3F3F3]" />
      <div>
        <p className="text-[12px] font-bold text-black">{author}</p>
        <p className="text-[11px] text-[#999999] font-medium">{role}</p>
      </div>
    </div>
  </div>
);

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-[#F9F9F9] text-black font-sans selection:bg-[#0054CB]/20 min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <SectionLabel>Investing, engineered</SectionLabel>

            <h1 className="text-[52px] sm:text-[64px] lg:text-[80px] font-extrabold tracking-[-0.05em] text-black leading-[0.95] mb-6">
              Master your wealth.<br />
              <span className="text-[#555555]">Elevate your future.</span>
            </h1>

            <p className="text-[16px] text-[#555555] font-medium leading-relaxed max-w-xl mb-8">
              The sophisticated command center for the modern investor. Track, analyze, and optimize
              your global portfolio with precision.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="h-10 px-6 bg-black text-white text-[12px] font-bold rounded-[6px] flex items-center gap-2 hover:bg-[#1a1a1a] active:scale-95 transition"
              >
                Start free <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="h-10 px-6 bg-white text-black text-[12px] font-bold rounded-[6px] flex items-center gap-2 hover:bg-[#F3F3F3] active:scale-95 transition shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
              >
                Sign in
              </Link>
            </div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <div className="bg-white rounded-[16px] shadow-[0_24px_80px_rgba(0,0,0,0.08)] overflow-hidden border border-[rgba(27,27,27,0.06)]">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(27,27,27,0.06)] bg-[#F9F9F9]">
                {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
                <div className="mx-auto h-5 w-48 bg-[#F3F3F3] rounded-[4px]" />
              </div>
              {/* Mock content */}
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 h-48 bg-[#F9F9F9] rounded-[8px]" />
                <div className="col-span-1 h-48 bg-[#F9F9F9] rounded-[8px]" />
                <div className="col-span-1 h-28 bg-[#F9F9F9] rounded-[8px]" />
                <div className="col-span-2 h-28 bg-[#F9F9F9] rounded-[8px]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
      <div className="border-y border-[rgba(27,27,27,0.06)] bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999999] text-center mb-6">
            Trusted by investors from
          </p>
          <div className="flex flex-wrap justify-center gap-10 lg:gap-16">
            {["Goldman", "Morgan", "Schwab", "Fidelity", "Vanguard"].map((name) => (
              <div key={name} className="flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.03em] text-[#999999]">
                <Globe size={16} /> {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="50K+" label="Active investors" icon={<TrendingUp size={16} />} />
            <StatCard value="$2B+" label="Assets tracked" icon={<BarChart2 size={16} />} />
            <StatCard value="99.9%" label="Uptime SLA" icon={<Zap size={16} />} />
            <StatCard value="256-bit" label="Encryption" icon={<Shield size={16} />} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-16" id="features">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Why Uwekezaji</SectionLabel>
          <h2 className="text-[36px] font-extrabold tracking-[-0.05em] text-black mb-10 leading-tight">
            Everything you need.<br />Nothing you don't.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Smartphone size={13} className="text-[#555555]" />}
              tag="Easy Import"
              title="Complete financial picture"
              description="Connect all your accounts via secure API integration with thousands of providers."
            />
            <FeatureCard
              icon={<BarChart2 size={13} className="text-[#555555]" />}
              tag="Advanced Analytics"
              title="Deep portfolio insights"
              description="Asset allocation, historical performance, and AI-powered risk ratings in one view."
            />
            <FeatureCard
              icon={<Shield size={13} className="text-[#555555]" />}
              tag="Bank-Grade Security"
              title="Your data, protected"
              description="256-bit encryption means no one can access your financial data — not even us."
            />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <SectionLabel>Testimonials</SectionLabel>
          <div className="flex items-baseline gap-4">
            <h2 className="text-[32px] font-extrabold tracking-[-0.05em] text-black">What users love</h2>
            <span className="text-[13px] font-bold text-[#555555]">4.9 / 5 rating</span>
          </div>
        </div>
        <div className="flex gap-4 animate-[scroll_40s_linear_infinite] w-max px-4 sm:px-6">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <TestimonialCard quote="For the first time, I feel completely in control of my financial picture." author="Jane Doe" role="Tech Founder" />
              <TestimonialCard quote="The analytics are mind-blowing. I can finally see my true exposure across sectors." author="Marcus R." role="Investment Banker" />
              <TestimonialCard quote="Beautiful UI, secure, and incredibly fast. Best portfolio tracker on the market." author="Sarah L." role="Index Fund Investor" />
              <TestimonialCard quote="I love the dividend tracking. It helps me plan my monthly cashflow perfectly." author="David K." role="Equity Trader" />
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black rounded-[16px] p-10 md:p-14 text-center">
            <SectionLabel>Get started today</SectionLabel>
            <h2 className="text-[36px] font-extrabold tracking-[-0.05em] text-white leading-tight mb-3">
              Ready to take control?
            </h2>
            <p className="text-[14px] text-white/60 font-medium mb-8 max-w-md mx-auto">
              Join thousands of investors who trust Uwekezaji to manage their portfolios.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-10 px-8 bg-white text-black text-[12px] font-bold rounded-[6px] hover:bg-[#F3F3F3] active:scale-95 transition"
            >
              Create free account <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(27,27,27,0.06)] bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <UwekezajiLogo className="mb-4" />
              <p className="text-[13px] text-[#555555] font-medium leading-relaxed max-w-[200px]">
                The premier platform for the discerning investor.
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Mobile App"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#999999] mb-4">{title}</p>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-[13px] font-medium text-[#555555] hover:text-black transition">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(27,27,27,0.06)] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[11px] text-[#999999] font-medium">
              © {new Date().getFullYear()} Uwekezaji Inc. All rights reserved.
            </p>
            <div className="flex gap-5">
              {["Privacy Policy", "Terms of Service", "Cookies"].map((l) => (
                <a key={l} href="#" className="text-[11px] font-medium text-[#999999] hover:text-black transition">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
