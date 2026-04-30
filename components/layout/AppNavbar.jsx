import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronRight, Bell, Star, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/features/slices/authSlice";
import { useCurrentUserId } from "@/hooks/auth/use-current-user";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { navItems } from "./NavItems";
import { UwekezajiLogo } from "./UwekezajiLogo";
import { GlobalSearch } from "./GlobalSearch";

const cn = (...c) => c.filter(Boolean).join(" ");
const haptic = { light: () => { try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10); } catch {} } };

/* ── Theme Toggle Button ──────────────────────────────────────────────────── */
const ThemeToggle = ({ className = "" }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition",
        className
      )}
      aria-label="Toggle theme"
    >
      {mounted
        ? theme === "dark"
          ? <Sun size={17} className="text-muted-foreground" />
          : <Moon size={17} className="text-muted-foreground" />
        : <Moon size={17} className="text-muted-foreground" />
      }
    </button>
  );
};

/* ── Drawer ───────────────────────────────────────────────────────────────── */
const Drawer = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          className="fixed inset-0 z-[98] bg-black/30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="fixed top-0 left-0 bottom-0 z-[99] w-72 max-w-[85vw] bg-card flex flex-col"
          style={{ boxShadow: "4px 0 32px rgba(0,0,0,0.15)" }}
          initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
        >
          <div className="flex items-center justify-between h-14 px-5 border-b border-border shrink-0">
            <UwekezajiLogo />
            <button
              aria-label="Close menu"
              className="h-9 w-9 flex items-center justify-center rounded-[6px] hover:bg-muted transition-colors"
              onClick={onClose}
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          {/* pb-20 ensures content clears the fixed bottom navigation bar */}
          <div className="flex-1 overflow-y-auto p-3 pb-20">{children}</div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

/* ── Bottom Bar ───────────────────────────────────────────────────────────── */
const BottomBar = ({ onOpenDrawer, items }) => {
  const router = useRouter();
  // Show at most 2 items left of Menu, 1 right — always leave room for Menu button
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[97] bg-card border-t border-border pb-safe nav-shadow">
      <div className="grid grid-cols-5 h-[56px]">
        {leftItems.map((item) => {
          const isActive = router.pathname === item.link || router.pathname.startsWith(item.link + "/");
          return (
            <Link key={item.name} href={item.link}
              className={cn("flex flex-col items-center justify-center gap-1 transition active:scale-95",
                isActive ? "text-foreground" : "text-tertiary")}
              onClick={haptic.light}
            >
              {React.cloneElement(item.icon, { className: cn("h-5 w-5", isActive ? "text-foreground" : "text-tertiary") })}
              <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{item.name}</span>
            </Link>
          );
        })}
        <button aria-label="Menu"
          className="flex flex-col items-center justify-center gap-1 text-tertiary transition active:scale-95"
          onClick={() => { haptic.light(); onOpenDrawer(); }}
        >
          <Menu size={20} />
          <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Menu</span>
        </button>
        {rightItems.map((item) => {
          const isActive = router.pathname === item.link || router.pathname.startsWith(item.link + "/");
          return (
            <Link key={item.name} href={item.link}
              className={cn("flex flex-col items-center justify-center gap-1 transition active:scale-95",
                isActive ? "text-foreground" : "text-tertiary")}
              onClick={haptic.light}
            >
              {React.cloneElement(item.icon, { className: cn("h-5 w-5", isActive ? "text-foreground" : "text-tertiary") })}
              <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{item.name}</span>
            </Link>
          );
        })}
        {/* Fill empty cells if fewer than 2 right items */}
        {rightItems.length < 2 && (
          <div />
        )}
      </div>
    </div>
  );
};

/* ── Search Overlay ───────────────────────────────────────────────────────── */
const SearchOverlay = ({ open, onClose }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[150] bg-black/60 flex flex-col"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border-b border-border px-4 py-3 shadow-xl"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <GlobalSearch
              className="flex-1"
              placeholder="Search stocks, funds…"
              onNavigate={onClose}
            />
            <button
              onClick={onClose}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition"
              aria-label="Close search"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Main Navbar ──────────────────────────────────────────────────────────── */
const Navbar = () => {
  const userId = useCurrentUserId();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  const visibleNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  useEffect(() => {
    if (!isMobile) return;
    let startX = null, startY = null;
    const onTouchStart = (e) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY; };
    const onTouchMove = (e) => {
      if (startX === null) return;
      const t = e.touches[0];
      if (!menuOpen && startX < 24 && t.clientX - startX > 40 && Math.abs(t.clientY - startY) < 30) {
        setMenuOpen(true); startX = null;
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => { window.removeEventListener("touchstart", onTouchStart); window.removeEventListener("touchmove", onTouchMove); };
  }, [isMobile, menuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4 sm:px-5 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition"
            aria-label="Open menu" onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} className="text-muted-foreground" />
          </button>
          <Link href="/" className="active:scale-95 transition-transform">
            <UwekezajiLogo />
          </Link>
        </div>

        {/* Center — desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((item) => {
            const isActive = router.pathname === item.link || router.pathname.startsWith(item.link + "/");
            return (
              <Link key={item.name} href={item.link}
                className={cn(
                  "h-9 px-3 flex items-center gap-2 rounded-[6px] transition-all active:scale-95 text-[13px] font-semibold",
                  isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label={item.name}
              >
                {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition"
            aria-label="Search"
          >
            <Search size={17} className="text-muted-foreground" />
          </button>
          <ThemeToggle />
          <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition" aria-label="Favorites">
            <Star size={17} className="text-muted-foreground" />
          </button>
          <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition" aria-label="Alerts">
            <Bell size={17} className="text-muted-foreground" />
          </button>
          {userId && (
            <div className="hidden md:flex ml-1">
              <button className="h-9 px-4 bg-foreground text-background text-[11px] font-bold rounded-[6px] hover:opacity-80 active:scale-95 transition uppercase tracking-[0.05em]">
                Pro
              </button>
            </div>
          )}
        </div>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile drawer */}
      <Drawer open={isMobile && menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="space-y-0.5">
          {/* Search row inside drawer */}
          <button
            onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
            className="w-full h-11 flex items-center gap-3 px-3 rounded-[6px] hover:bg-muted text-[13px] font-semibold text-foreground transition"
          >
            <Search size={16} className="text-muted-foreground" /> Search securities
          </button>

          <div className="my-2 h-px bg-border mx-1" />

          {visibleNavItems.map((item) => {
            const isActive = router.pathname === item.link || router.pathname.startsWith(item.link + "/");
            return (
              <Link key={item.name} href={item.link}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "w-full h-11 flex items-center justify-between px-3 rounded-[6px] transition active:scale-[.99]",
                  isActive ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3 text-[13px] font-semibold">
                  {React.cloneElement(item.icon, { className: cn("h-4 w-4", isActive ? "opacity-80" : "text-muted-foreground") })}
                  {item.name}
                </div>
                <ChevronRight size={14} className="opacity-30" />
              </Link>
            );
          })}

          <div className="my-2 h-px bg-border mx-1" />

          <button className="w-full h-11 flex items-center gap-3 px-3 rounded-[6px] hover:bg-muted text-[13px] font-semibold text-foreground transition">
            <Star size={16} className="text-muted-foreground" /> Favorites
          </button>
          <button className="w-full h-11 flex items-center gap-3 px-3 rounded-[6px] hover:bg-muted text-[13px] font-semibold text-foreground transition">
            <Bell size={16} className="text-muted-foreground" /> Alerts
          </button>

          <div className="my-2 h-px bg-border mx-1" />

          {/* Theme toggle in drawer */}
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">Appearance</span>
            <ThemeToggle />
          </div>

          {userId && (
            <div className="px-1 pt-2">
              <button className="w-full h-10 bg-foreground text-background text-[11px] font-bold px-3 rounded-[6px] hover:opacity-80 active:scale-95 transition uppercase tracking-[0.08em]">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </Drawer>

      {isMobile && <BottomBar onOpenDrawer={() => setMenuOpen(true)} items={visibleNavItems} />}
    </>
  );
};

export const AppNavbar = () => <Navbar />;
