"use client";
import localFont from "next/font/local";
import useKeepScreenOn from '../hooks/useKeepScreenOn';
const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});


export default function Loading({ textMsg }) {

  useKeepScreenOn();
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#990000]" />

        {/* Message */}
        <p className={`${fontHorror.className} text-[#990000] text-2xl sm:text-3xl md:text-4xl tracking-widest drop-shadow-[0_0_10px_rgba(255,0,0,0.4)] break-words`}>
          {textMsg || "Werewolf..."}
        </p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ textMsg }) {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#990000]" />

        {/* Message */}
        <p className={`${fontHorror.className} text-[#990000] text-xl sm:text-2xl md:text-3xl tracking-widest drop-shadow-[0_0_10px_rgba(255,0,0,0.4)] break-words`}>
          {textMsg || "Processing..."}
        </p>
      </div>
    </div>
  );
}
