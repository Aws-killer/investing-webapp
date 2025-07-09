import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/features/slices/authSlice";
import { Skeleton } from "@/components/ui/skeleton";

export function withAuth(WrappedComponent) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check authentication after redux-persist rehydration
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        if (!isAuthenticated) {
          router.replace("/login");
        }
      }, 100); // Small delay to ensure redux-persist has rehydrated

      return () => clearTimeout(timeoutId);
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
