"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import Loading from "@/components/Loading"
import localFont from "next/font/local";

const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);



  useEffect(() => {
    const selected = localStorage.getItem(KEYS.SERVER_SELECTED);
    if (!selected) {
      router.replace(PATHS.SERVER); // no server → redirect
    } else {
      //
      const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);
      if (!accessToken || !refreshToken) {
        // no token → redirect
        router.replace(PATHS.SIGN_IN);
      } else {
        setAllowed(true);
      }
    }
  }, []);

  if (!allowed) <Loading />
  return children;
}
