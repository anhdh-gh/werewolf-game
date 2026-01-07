import { Creepster } from "next/font/google";

const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });

export default function Loading({ textMsg }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#990000]" />

        {/* Message */}
        <p className={`${fontHorror.className} text-[#990000] text-4xl sm:text-5xl tracking-widest drop-shadow-[0_0_15px_rgba(255,0,0,0.4)]`}>
          {textMsg || "Werewolf..."}
        </p>
      </div>
    </div>
  );
}
