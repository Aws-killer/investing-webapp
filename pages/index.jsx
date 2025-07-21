// App.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, useAnimate, stagger, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  BarChartHorizontal,
  CalendarClock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

/* -------------------------------- UTILS ---------------------------------- */
const cn = (...c) => c.filter(Boolean).join(" ");

/* ---------------------------- INTERSECTION HOOK -------------------------- */
const useIntersection = (ref, options, cb) => {
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && cb(), options);
    const el = ref.current;
    if (el) obs.observe(el);
    return () => el && obs.unobserve(el);
  }, [ref, options, cb]);
};

/* ---------------------------- GLOWING EFFECT ----------------------------- */
const GlowingEffect = memo(
  ({ disabled = false, glow = true, className }) => {
    const ref = useRef();
    const last = useRef({ x: 0, y: 0 });
    const raf = useRef();

    const onMove = useCallback((e) => {
      if (!ref.current) return;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const b = ref.current.getBoundingClientRect();
        const x = e?.clientX ?? last.current.x;
        const y = e?.clientY ?? last.current.y;
        last.current = { x, y };
        const ang =
          Math.atan2(y - (b.top + b.height / 2), x - (b.left + b.width / 2)) *
            (180 / Math.PI) +
          90;
        ref.current.style.setProperty("--start", `${ang}deg`);
        ref.current.style.setProperty(
          "--active",
          b.left - 64 < x && x < b.right + 64 && b.top - 64 < y && y < b.bottom + 64
            ? "1"
            : "0"
        );
      });
    }, []);

    useEffect(() => {
      if (disabled) return;
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }, [onMove, disabled]);

    return (
      <div
        ref={ref}
        style={{
          "--start": "0deg",
          "--active": "0",
          "--glow": "conic-gradient(from var(--start), #6366f1, #ec4899, #f59e0b, #10b981, #6366f1)",
        }}
        className={cn(
          "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500",
          glow && "opacity-100",
          className
        )}
      >
        <div
          className="absolute inset-0 rounded-[inherit] [mask:conic-gradient(from_calc(var(--start)-20deg),transparent_0deg,#fff_40deg,transparent_80deg)] opacity-[var(--active)]"
          style={{ background: "var(--glow)" }}
        />
      </div>
    );
  }
);
GlowingEffect.displayName = "GlowingEffect";

/* ---------------------------- GLASS CARD --------------------------------- */
const GlassCard = ({ icon, title, desc }) => (
  <motion.li
    className="min-h-[14rem] list-none"
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative h-full rounded-2xl border border-neutral-700/30 p-1">
      <GlowingEffect />
      <div className="relative flex h-full flex-col justify-between gap-6 rounded-xl bg-neutral-950/60 p-6 backdrop-blur-sm">
        <div className="w-fit rounded-lg border border-neutral-700 bg-neutral-900/80 p-2">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-neutral-400">{desc}</p>
        </div>
      </div>
    </div>
  </motion.li>
);

/* ---------------------------- TYPEWRITER --------------------------------- */
const Typewriter = ({ text }) => {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setOut(text.slice(0, ++i));
      if (i === text.length) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [text]);
  return <>{out}</>;
};

/* ---------------------------- BACKGROUND LINES --------------------------- */
const Lines = () => {
  const { scrollYProgress } = useScroll();
  const blur = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const paths = [
    "M720 450C720 450 742.459 440.315 755.249 425.626C768.039 410.937 778.88 418.741 789.478 401.499C800.076 384.258 817.06 389.269 826.741 380.436C836.423 371.603 851.957 364.826 863.182 356.242C874.408 347.657 877.993 342.678 898.867 333.214C919.741 323.75 923.618 319.88 934.875 310.177C946.133 300.474 960.784 300.837 970.584 287.701C980.384 274.564 993.538 273.334 1004.85 263.087C1016.15 252.84 1026.42 250.801 1038.22 242.1C1050.02 233.399 1065.19 230.418 1074.63 215.721C1084.07 201.024 1085.49 209.128 1112.65 194.884C1139.8 180.64 1132.49 178.205 1146.43 170.636C1160.37 163.066 1168.97 158.613 1181.46 147.982C1193.95 137.35 1191.16 131.382 1217.55 125.645C1243.93 119.907 1234.19 118.899 1254.53 100.846C1274.86 82.7922 1275.12 92.8914 1290.37 76.09C1305.62 59.2886 1313.91 62.1868 1323.19 56.7536C1332.48 51.3204 1347.93 42.8082 1361.95 32.1468C1375.96 21.4855 1374.06 25.168 1397.08 10.1863C1420.09 -4.79534 1421.41 -3.16992 1431.52 -15.0078",
  ];
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return (
    <motion.svg
      viewBox="0 0 1440 900"
      className="absolute inset-0 -z-10 w-full h-full"
      style={{ filter: `blur(${blur}px)` }}
    >
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={colors[i % colors.length]}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{
            duration: 10,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 2,
          }}
        />
      ))}
    </motion.svg>
  );
};

/* ---------------------------- CONTENT DATA ------------------------------- */
const data = {
  hero: {
    title: "The premier platform for the discerning investor.",
    body: "Uwekezaji provides a sophisticated, unified view of your entire financial portfolio. Track stocks, bonds, and unit trusts with powerful, design-forward tools that bring clarity to complexity.",
  },
  features: {
    title: "Your Assets, Under a Singular, Elegant Lens.",
    body: "Every tool you need for a comprehensive financial overview. We've obsessed over the details so you don't have to.",
  },
  testimonial: {
    quote:
      "For the first time, I feel completely in control of my financial picture. It’s not just a tool; it’s a partner.",
    name: "Jane Doe",
    role: "Founder & CEO, Tech Innovations",
  },
  cta: {
    title: "Take Control of Your Financial Future.",
    body: "Join a new generation of investors who value design, clarity, and control. Start for free and import your portfolio in minutes.",
  },
};
const cards = [
  {
    icon: <Wallet className="h-5 w-5 text-neutral-400" />,
    title: "Unified Dashboard",
    desc: "Monitor your net worth and allocation in one intuitive view.",
  },
  {
    icon: <BarChartHorizontal className="h-5 w-5 text-neutral-400" />,
    title: "In-Depth Analytics",
    desc: "Advanced charts, historical data, and dividend tracking.",
  },
  {
    icon: <CalendarClock className="h-5 w-5 text-neutral-400" />,
    title: "Event Tracking",
    desc: "Never miss a dividend, bond maturity, or key date.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-neutral-400" />,
    title: "Bank-Grade Security",
    desc: "End-to-end encryption and zero-knowledge architecture.",
  },
];

/* ---------------------------- MAIN APP ----------------------------------- */
export default function App() {
  const [section, setSection] = useState("hero");
  const refs = { hero: useRef(), features: useRef(), testimonial: useRef(), cta: useRef() };
  const opts = { threshold: 0.4 };
  useIntersection(refs.hero, opts, () => setSection("hero"));
  useIntersection(refs.features, opts, () => setSection("features"));
  useIntersection(refs.testimonial, opts, () => setSection("testimonial"));
  useIntersection(refs.cta, opts, () => setSection("cta"));

  return (
    <motion.div
      className="relative min-h-screen bg-neutral-950 text-neutral-100 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Lines />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px,transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="container mx-auto grid grid-cols-12 gap-8 px-4 lg:px-8">
        {/* -------- SIDEBAR -------- */}
        <aside className="sticky top-24 col-span-12 flex h-[calc(100vh-6rem)] flex-col justify-between py-24 lg:col-span-5">
          <div>
            <h1 className="font-display text-3xl font-bold">uwekezaji</h1>
            <div className="mt-12 h-48">
              <h2 className="font-serif text-4xl leading-tight md:text-5xl">
                <Typewriter key={section} text={data[section].title} />
              </h2>
            </div>
            <nav className="mt-10 flex flex-col space-y-2">
              {["hero", "features", "testimonial", "cta"].map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    refs[k].current.scrollIntoView({ behavior: "smooth" })
                  }
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    section === k ? "bg-white w-8" : "bg-neutral-600"
                  )}
                />
              ))}
            </nav>
          </div>
          <div>
            <p className="text-neutral-400">{data[section].body}</p>
            <p className="mt-12 text-xs text-neutral-600">
              © {new Date().getFullYear()} Uwekezaji Inc.
            </p>
          </div>
        </aside>

        {/* -------- MAIN -------- */}
        <main className="col-span-12 flex flex-col gap-48 py-24 lg:col-span-7">
          <div ref={refs.hero} className="h-32" />
          <section id="features" ref={refs.features}>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              {cards.map((c, i) => (
                <GlassCard key={i} {...c} />
              ))}
            </ul>
          </section>

          <section id="testimonial" ref={refs.testimonial} className="flex items-start gap-5">
            <img
              src="https://i.imgur.com/qZcuEyaKrTY7QOZn3jdicg30P4.jpeg"
              alt="Jane"
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <p className="font-serif text-2xl italic">
                “<Typewriter text={data.testimonial.quote} />”
              </p>
              <p className="mt-3 font-semibold">{data.testimonial.name}</p>
              <p className="text-sm text-neutral-500">{data.testimonial.role}</p>
            </div>
          </section>

          <section
            id="cta"
            ref={refs.cta}
            className="relative overflow-hidden rounded-2xl border border-neutral-700/30 bg-neutral-900/30 p-10 text-center backdrop-blur-sm"
          >
            <h2 className="font-display text-3xl md:text-4xl">{data.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-neutral-400">{data.cta.body}</p>
            <div className="mt-8 flex justify-center gap-4">
              <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-neutral-200">
                Start Free <ArrowRight className="inline h-4 w-4" />
              </button>
              <button className="rounded-md border border-neutral-600 px-6 py-3 text-sm text-neutral-300 hover:bg-neutral-800">
                Watch Demo
              </button>
            </div>
          </section>

          <div className="h-48" />
        </main>
      </div>
    </motion.div>
  );
}