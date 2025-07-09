import React from "react";
import {
  ArrowRight,
  BarChartHorizontal,
  Briefcase,
  CalendarClock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

// A reusable pill-shaped tag for categories
const CategoryTag = ({ text }) => (
  <div className="inline-block whitespace-nowrap rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
    {text}
  </div>
);

// The main card for showcasing a feature
const FeatureCard = ({ title, tags, imageUrl, description }) => (
  <div className="flex flex-col gap-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm md:p-6">
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="font-sans text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <CategoryTag key={tag} text={tag} />
        ))}
      </div>
    </div>
    <div className="aspect-[16/9] w-full overflow-hidden rounded-md">
      <img
        src={imageUrl}
        alt={title}
        className="h-full w-full object-cover transition-transform hover:scale-105"
      />
    </div>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

// A dedicated card for testimonials
const TestimonialCard = ({ quote, author, title, avatarUrl }) => (
  <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm md:p-8">
    <blockquote className="font-serif text-xl italic text-foreground md:text-2xl">
      "{quote}"
    </blockquote>
    <div className="mt-6 flex items-center gap-4">
      <img
        src={avatarUrl}
        alt={author}
        className="h-11 w-11 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-foreground">{author}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  </div>
);

// The main App component acting as the Landing Page
export default function App() {
  return (
    <div className="bg-background font-sans text-foreground">
      <div className="container mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* --- Sticky Sidebar --- */}
          <aside className="lg:sticky lg:top-0 flex h-full flex-col justify-between py-10 lg:col-span-4 lg:h-screen lg:py-24">
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight">
                uwekezaji
              </h1>
              <h2 className="mt-3 font-serif text-xl text-muted-foreground">
                The premier platform for the discerning investor.
              </h2>
              <p className="mt-6 leading-relaxed text-foreground/80">
                Uwekezaji provides a sophisticated, unified view of your entire
                financial portfolio. Track stocks, bonds, and unit trusts with
                powerful, design-forward tools that bring clarity to complexity.
              </p>
            </div>
            <div className="mt-8 hidden lg:block">
              <nav className="flex flex-col space-y-3">
                <a
                  href="#features"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </a>
              </nav>
              <p className="mt-8 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Uwekezaji Inc. All Rights Reserved.
              </p>
            </div>
          </aside>

          {/* --- Main Content Feed --- */}
          <main className="py-10 lg:col-span-8 lg:py-24">
            <div className="flex flex-col gap-12">
              <div id="features" className="flex flex-col gap-6">
                <h2 className="font-sans text-4xl font-bold tracking-tighter md:text-5xl">
                  Your Assets, <br />
                  Under a Singular, Elegant Lens.
                </h2>
              </div>

              {/* Feature Cards */}
              <FeatureCard
                title="Unified Portfolio Dashboard"
                tags={["Portfolio", "Dashboard"]}
                imageUrl="https://i.imgur.com/uSfeGjW.png"
                description="Monitor your total net worth, asset allocation, and performance over time. Our dashboard brings all your stocks, bonds, and UTTs together in a single, intuitive view."
              />

              <FeatureCard
                title="In-Depth Analytics & Reporting"
                tags={["Analytics", "Stocks", "Data"]}
                imageUrl="https://i.imgur.com/gO0GMl5.png"
                description="Go beyond the surface with in-depth charts, historical performance data, and dividend tracking to make smarter, data-driven investment decisions."
              />

              <TestimonialCard
                quote="The clarity Uwekezaji brings is unparalleled. For the first time, I feel completely in control of my financial picture. It's not just a tool; it's a partner in my investment journey."
                author="Jane Doe"
                title="Founder & CEO, Tech Innovations"
                avatarUrl="https://i.imgur.com/qZcuEyaKrTY7QOZn3jdicg30P4.jpeg"
              />

              <FeatureCard
                title="Automated Calendar & Event Tracking"
                tags={["Calendar", "Dividends", "Bonds"]}
                imageUrl="https://i.imgur.com/F0fIHYj.png"
                description="Never miss a key date. The integrated calendar automatically tracks upcoming dividend payments, bond maturities, and other critical events across your entire portfolio."
              />

              {/* CTA Card */}
              <div
                id="pricing"
                className="relative overflow-hidden rounded-lg bg-primary p-8 text-center text-primary-foreground"
              >
                <h2 className="font-sans text-3xl font-bold tracking-tight md:text-4xl">
                  Take Control of Your Financial Future.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
                  Join a new generation of investors who value design, clarity,
                  and control. Start for free and import your portfolio in
                  minutes.
                </p>
                <button className="mt-8 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary ring-offset-background transition-colors hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Sign Up Free <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
