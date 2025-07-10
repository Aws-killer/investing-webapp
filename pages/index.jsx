import React from "react";
import { useState, useEffect, useRef, useCallback, memo } from "react";

import { motion, useAnimate, stagger, animate } from "motion/react";
import {
  ArrowRight,
  BarChartHorizontal,
  CalendarClock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

// --- UTILITY ---
// A simple utility for conditional class names.
const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- INTERSECTION OBSERVER HOOK ---
// This custom hook detects when an element is in the viewport
const useIntersection = (ref, options, callback) => {
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options, callback]);
};

// --- REUSABLE UI COMPONENTS ---

// Component: GlowingEffect (provided by user)
const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = true,
  }) => {
    const containerRef = useRef(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef(0);

    const handleMove = useCallback(
      (e) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          let targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;
      const handleScroll = () => handleMove();
      const handlePointerMove = (e) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
        />
        <div
          ref={containerRef}
          style={{
            "--blur": `${blur}px`,
            "--spread": spread,
            "--start": "0",
            "--active": "0",
            "--glowingeffect-border-width": `${borderWidth}px`,
            "--repeating-conic-gradient-times": "5",
            "--gradient": `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
              radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
              radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
              radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
              repeating-conic-gradient(
                from 236.84deg at 50% 50%,
                #dd7bbb 0%,
                #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
              )`,
          }}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)] ",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);
GlowingEffect.displayName = "GlowingEffect";

// Component: GridItem (Adapted from user's demo)
const GridItem = ({ area, icon, title, description }) => (
  <li className={cn("min-h-[14rem] list-none", area)}>
    <div className="relative h-full rounded-2xl border border-neutral-800 p-2 md:rounded-3xl md:p-3">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />
      <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-neutral-950/80 p-6 md:p-6 backdrop-blur-sm">
        <div className="relative flex flex-1 flex-col justify-between gap-3">
          <div className="w-fit rounded-lg border border-neutral-700 bg-neutral-900 p-2">
            {icon}
          </div>
          <div className="space-y-3">
            <h3 className="-tracking-wide pt-0.5 font-sans text-xl font-semibold text-balance text-white md:text-2xl">
              {title}
            </h3>
            <p className="font-sans text-sm text-neutral-400">{description}</p>
          </div>
        </div>
      </div>
    </div>
  </li>
);

// Component: BackgroundLines (Provided by user)
const pathVariants = {
  initial: { strokeDashoffset: 800, strokeDasharray: "50 800" },
  animate: {
    strokeDashoffset: 0,
    strokeDasharray: "20 800",
    opacity: [0, 1, 1, 0],
  },
};
const SVG = ({ svgOptions }) => {
  const paths = [
    "M720 450C720 450 742.459 440.315 755.249 425.626C768.039 410.937 778.88 418.741 789.478 401.499C800.076 384.258 817.06 389.269 826.741 380.436C836.423 371.603 851.957 364.826 863.182 356.242C874.408 347.657 877.993 342.678 898.867 333.214C919.741 323.75 923.618 319.88 934.875 310.177C946.133 300.474 960.784 300.837 970.584 287.701C980.384 274.564 993.538 273.334 1004.85 263.087C1016.15 252.84 1026.42 250.801 1038.22 242.1C1050.02 233.399 1065.19 230.418 1074.63 215.721C1084.07 201.024 1085.49 209.128 1112.65 194.884C1139.8 180.64 1132.49 178.205 1146.43 170.636C1160.37 163.066 1168.97 158.613 1181.46 147.982C1193.95 137.35 1191.16 131.382 1217.55 125.645C1243.93 119.907 1234.19 118.899 1254.53 100.846C1274.86 82.7922 1275.12 92.8914 1290.37 76.09C1305.62 59.2886 1313.91 62.1868 1323.19 56.7536C1332.48 51.3204 1347.93 42.8082 1361.95 32.1468C1375.96 21.4855 1374.06 25.168 1397.08 10.1863C1420.09 -4.79534 1421.41 -3.16992 1431.52 -15.0078",
    "M720 450C720 450 712.336 437.768 690.248 407.156C668.161 376.544 672.543 394.253 665.951 365.784C659.358 337.316 647.903 347.461 636.929 323.197C625.956 298.933 626.831 303.639 609.939 281.01C593.048 258.381 598.7 255.282 582.342 242.504C565.985 229.726 566.053 217.66 559.169 197.116C552.284 176.572 549.348 171.846 529.347 156.529C509.345 141.211 522.053 134.054 505.192 115.653C488.33 97.2527 482.671 82.5627 473.599 70.7833C464.527 59.0039 464.784 50.2169 447 32.0721C429.215 13.9272 436.29 0.858563 423.534 -12.6868C410.777 -26.2322 407.424 -44.0808 394.364 -56.4916C381.303 -68.9024 373.709 -72.6804 365.591 -96.1992C357.473 -119.718 358.364 -111.509 338.222 -136.495C318.08 -161.481 322.797 -149.499 315.32 -181.761C307.843 -214.023 294.563 -202.561 285.795 -223.25C277.026 -243.94 275.199 -244.055 258.602 -263.871",
    "M720 450C720 450 695.644 482.465 682.699 506.197C669.755 529.929 671.059 521.996 643.673 556.974C616.286 591.951 625.698 590.8 606.938 615.255C588.178 639.71 592.715 642.351 569.76 665.92C546.805 689.49 557.014 687.498 538.136 722.318C519.258 757.137 520.671 760.818 503.256 774.428C485.841 788.038 491.288 790.063 463.484 831.358C435.681 872.653 437.554 867.001 425.147 885.248C412.74 903.495 411.451 911.175 389.505 934.331C367.559 957.486 375.779 966.276 352.213 990.918C328.647 1015.56 341.908 1008.07 316.804 1047.24C291.699 1086.42 301.938 1060.92 276.644 1100.23C251.349 1139.54 259.792 1138.78 243.151 1153.64",
    "M720 450C720 450 737.033 492.46 757.251 515.772C777.468 539.084 768.146 548.687 785.517 570.846C802.887 593.005 814.782 609.698 824.589 634.112C834.395 658.525 838.791 656.702 855.55 695.611C872.31 734.519 875.197 724.854 890.204 764.253C905.21 803.653 899.844 790.872 919.927 820.763C940.01 850.654 939.071 862.583 954.382 886.946C969.693 911.309 968.683 909.254 993.997 945.221C1019.31 981.187 1006.67 964.436 1023.49 1007.61C1040.32 1050.79 1046.15 1038.25 1059.01 1073.05C1071.88 1107.86 1081.39 1096.19 1089.45 1131.96C1097.51 1167.73 1106.52 1162.12 1125.77 1196.89",
    "M720 450C720 450 714.384 428.193 708.622 410.693C702.86 393.193 705.531 397.066 703.397 372.66C701.264 348.254 697.8 345.181 691.079 330.466C684.357 315.751 686.929 312.356 683.352 292.664C679.776 272.973 679.079 273.949 674.646 255.07C670.213 236.192 670.622 244.371 665.271 214.561C659.921 184.751 659.864 200.13 653.352 172.377C646.841 144.623 647.767 151.954 644.123 136.021C640.48 120.088 638.183 107.491 636.127 96.8178C634.072 86.1443 632.548 77.5871 626.743 54.0492C620.938 30.5112 622.818 28.9757 618.613 16.577C614.407 4.17831 615.555 -13.1527 608.752 -24.5691C601.95 -35.9855 603.375 -51.0511 599.526 -60.1492C595.678 -69.2472 593.676 -79.3623 587.865 -100.431C582.053 -121.5 584.628 -117.913 578.882 -139.408C573.137 -160.903 576.516 -161.693 571.966 -182.241C567.416 -202.789 567.42 -198.681 562.834 -218.28C558.248 -237.879 555.335 -240.47 552.072 -260.968C548.808 -281.466 547.605 -280.956 541.772 -296.427C535.94 -311.898 537.352 -315.211 535.128 -336.018C532.905 -356.826 531.15 -360.702 524.129 -377.124",
  ];
  const colors = [
    "#46A5CA",
    "#8C2F2F",
    "#4FAE4D",
    "#D6590C",
    "#811010",
    "#247AFB",
    "#A534A0",
    "#A8A438",
    "#D6590C",
    "#46A29C",
    "#670F6D",
    "#D7C200",
    "#59BBEB",
    "#504F1C",
    "#55BC54",
    "#4D3568",
    "#9F39A5",
    "#363636",
    "#860909",
    "#6A286F",
    "#604483",
  ];
  return (
    <motion.svg
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full -z-10"
    >
      {paths.map((path, idx) => (
        <motion.path
          d={path}
          stroke={colors[idx % colors.length]}
          strokeWidth="2.3"
          strokeLinecap="round"
          variants={pathVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: svgOptions?.duration || 10,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.floor(Math.random() * 10),
            repeatDelay: Math.floor(Math.random() * 10 + 2),
          }}
          key={`path-first-${idx}`}
        />
      ))}
      {paths.map((path, idx) => (
        <motion.path
          d={path}
          stroke={colors[idx % colors.length]}
          strokeWidth="2.3"
          strokeLinecap="round"
          variants={pathVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: svgOptions?.duration || 10,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.floor(Math.random() * 10 + 5),
            repeatDelay: Math.floor(Math.random() * 10 + 5),
          }}
          key={`path-second-${idx}`}
        />
      ))}
    </motion.svg>
  );
};
const BackgroundLines = ({ children, className, svgOptions, ...props }) => (
  <div className={cn("relative w-full overflow-hidden", className)} {...props}>
    <SVG svgOptions={svgOptions} />
    {children}
  </div>
);

// Component: TextGenerateEffect (Provided by user)
const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  useEffect(() => {
    animate(
      "span",
      { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      { duration: duration, delay: stagger(0.1) }
    );
  }, [scope.current, words, animate, duration, filter]); // Re-run animation when words change

  return (
    <div className={cn("font-bold", className)}>
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="dark:text-white text-black opacity-0"
            style={{ filter: filter ? "blur(10px)" : "none" }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

// --- PAGE CONTENT DATA ---
const content = {
  hero: {
    title: "The premier platform for the discerning investor.",
    description:
      "Uwekezaji provides a sophisticated, unified view of your entire financial portfolio. Track stocks, bonds, and unit trusts with powerful, design-forward tools that bring clarity to complexity.",
  },
  features: {
    title: "Your Assets, Under a Singular, Elegant Lens.",
    description:
      "Every tool you need for a comprehensive financial overview. We've obsessed over the details so you don't have to.",
  },
  testimonial: {
    title: "Clarity that is simply unparalleled.",
    description:
      "For the first time, I feel completely in control of my financial picture. It's not just a tool; it's a partner in my investment journey.",
  },
  cta: {
    title: "Take Control of Your Financial Future.",
    description:
      "Join a new generation of investors who value design, clarity, and control. Start for free and import your portfolio in minutes.",
  },
};

const featureItems = [
  {
    area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/7]",
    icon: <Wallet className="h-6 w-6 text-neutral-400" />,
    title: "Unified Dashboard",
    description:
      "Monitor your total net worth and asset allocation. All your stocks, bonds, and UTTs in one intuitive view.",
  },
  {
    area: "md:[grid-area:1/7/2/13] xl:[grid-area:1/7/2/13]",
    icon: <BarChartHorizontal className="h-6 w-6 text-neutral-400" />,
    title: "In-Depth Analytics",
    description:
      "Go beyond the surface with in-depth charts, historical performance data, and dividend tracking.",
  },
  {
    area: "md:[grid-area:2/1/3/7] xl:[grid-area:2/1/3/7]",
    icon: <CalendarClock className="h-6 w-6 text-neutral-400" />,
    title: "Event Tracking",
    description:
      "Never miss a key date. Automatically track upcoming dividend payments, bond maturities, and critical events.",
  },
  {
    area: "md:[grid-area:2/7/3/13] xl:[grid-area:2/7/3/13]",
    icon: <ShieldCheck className="h-6 w-6 text-neutral-400" />,
    title: "Bank-Grade Security",
    description:
      "Your data is encrypted and private. We use industry-leading security protocols to protect your information.",
  },
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeSection, setActiveSection] = useState("hero");

  // Refs for each section to track scrolling
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialRef = useRef(null);
  const ctaRef = useRef(null);

  // Intersection observer setup
  const observerOptions = { root: null, rootMargin: "0px", threshold: 0.3 };
  useIntersection(heroRef, observerOptions, () => setActiveSection("hero"));
  useIntersection(featuresRef, observerOptions, () =>
    setActiveSection("features")
  );
  useIntersection(testimonialRef, observerOptions, () =>
    setActiveSection("testimonial")
  );
  useIntersection(ctaRef, observerOptions, () => setActiveSection("cta"));

  return (
    <BackgroundLines
      className="bg-black text-white font-sans"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)",
        backgroundSize: "25px 25px",
      }}
    >
      <div className="container mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16">
          {/* --- Static Sidebar (Scrolls with page) --- */}
          <aside className="flex flex-col justify-between py-10 lg:col-span-5 lg:py-24">
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-white">
                uwekezaji
              </h1>
              <div className="mt-12 h-48">
                <TextGenerateEffect
                  key={activeSection} // Re-renders component on change to trigger animation
                  words={content[activeSection].title}
                  className="font-serif text-4xl leading-tight text-neutral-200 md:text-5xl"
                />
              </div>
            </div>
            <div className="mt-8">
              <p className="leading-relaxed text-neutral-400">
                {content[activeSection].description}
              </p>
              <p className="mt-12 text-xs text-neutral-600">
                © {new Date().getFullYear()} Uwekezaji Inc. All Rights Reserved.
              </p>
            </div>
          </aside>

          {/* --- Main Content Feed --- */}
          <main className="py-10 lg:col-span-7 lg:py-24">
            <div className="flex flex-col gap-32 md:gap-48">
              {/* Hero Spacer */}
              <div ref={heroRef} className="h-32"></div>

              {/* Features Section */}
              <section ref={featuresRef} id="features">
                <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-2 lg:gap-8">
                  {featureItems.map((item, index) => (
                    <GridItem
                      key={index}
                      area={item.area}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </ul>
              </section>

              {/* Testimonial Section */}
              <section
                ref={testimonialRef}
                id="testimonials"
                className="flex flex-col items-start gap-4"
              >
                <img
                  src="https://i.imgur.com/qZcuEyaKrTY7QOZn3jdicg30P4.jpeg"
                  alt="Jane Doe"
                  className="h-16 w-16 rounded-full object-cover border-2 border-neutral-700"
                />
                <div>
                  <p className="font-serif text-2xl italic text-neutral-100">
                    "{content.testimonial.description}"
                  </p>
                  <p className="mt-4 font-semibold text-white">Jane Doe</p>
                  <p className="text-sm text-neutral-400">
                    Founder & CEO, Tech Innovations
                  </p>
                </div>
              </section>

              {/* CTA Section */}
              <section
                ref={ctaRef}
                id="pricing"
                className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/50 p-8 text-center backdrop-blur-sm"
              >
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {content.cta.title}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-neutral-400">
                  {content.cta.description}
                </p>
                <button className="mt-8 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-white px-6 py-3 text-sm font-semibold text-black ring-offset-background transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Sign Up Free <ArrowRight className="h-4 w-4" />
                </button>
              </section>

              {/* Bottom Spacer */}
              <div className="h-48"></div>
            </div>
          </main>
        </div>
      </div>
    </BackgroundLines>
  );
}
