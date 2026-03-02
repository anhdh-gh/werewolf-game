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
        <div className="relative w-20 h-20 mt-4">
  <img 
    src="https://cdn-icons-png.flaticon.com/512/702/702471.png"
    alt="Blood Moon"
    className="w-full h-full object-contain animate-pulse"
    style={{
      // Hiệu ứng Trăng Máu đỏ rực
      filter: "brightness(0.6) sepia(1) hue-rotate(-50deg) saturate(400%) drop-shadow(0 0 15px rgba(220, 38, 38, 0.8))"
    }} 
  />
</div>

        {/* Message */}
        <p className={`${fontHorror.className} text-[#990000] text-2xl sm:text-3xl md:text-4xl tracking-widest drop-shadow-[0_0_10px_rgba(255,0,0,0.4)] break-words`}>
          {textMsg || "Werewolf..."}
        </p>
      </div>
    </div>
  );
}


