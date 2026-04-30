import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/features/slices/authSlice";

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-full border-2 border-border" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground animate-spin" />
    </div>
  </div>
);

export function withAuth(WrappedComponent) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    // mounted = false on SSR and on first paint — ensures server HTML matches
    // client HTML (both render the spinner), so hydration never mismatches.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (mounted && !isAuthenticated) {
        router.replace("/login");
      }
    }, [mounted, isAuthenticated, router]);

    // During SSR / hydration: render spinner so the tree is never empty.
    // An empty tree leaves body{display:none} (next-pwa FOUC guard) in place.
    if (!mounted || !isAuthenticated) {
      return <LoadingScreen />;
    }

    return <WrappedComponent {...props} />;
  };
}
