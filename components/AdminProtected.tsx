"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowRefreshWarning(false);

      if (!user) {
        router.push("/login?message=Please login to access this page");
      } else if (user.role !== 'admin') {
        router.push("/?message=Access denied. Admin privileges required.");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading) {
      warningTimeoutRef.current = setTimeout(() => {
        if (loading) {
          setShowRefreshWarning(true);
        }
      }, 3000);

      refreshTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.log('Auto-refreshing page due to stuck loading...');
          window.location.reload();
        }
      }, 6000);
    } else {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowRefreshWarning(false);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-white text-xl mb-4">Loading...</div>
        {showRefreshWarning && (
          <div className="text-orange-400 text-sm opacity-75">
            Page will refresh automatically...
          </div>
        )}
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Checking permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
}