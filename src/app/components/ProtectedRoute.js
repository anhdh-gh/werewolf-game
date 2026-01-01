"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);

    if (!accessToken || !refreshToken) {
      // no token → redirect
      router.replace(PATHS.SIGN_IN);
    } else {
      setAllowed(true);
    }
  }, []);

  if (!allowed) return null; // or loading spinner
  return children;
}
