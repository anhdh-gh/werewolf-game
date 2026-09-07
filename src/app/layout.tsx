import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist, Cinzel } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL("https://wolf.anhdh.net"),
  title: "Ma Sói",
  description: "Ma sói chơi cùng bàn hoặc từ xa, chỉ cần một mã phòng",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Ma Sói",
    description: "Ma sói chơi cùng bàn hoặc từ xa, chỉ cần một mã phòng",
    locale: "vi_VN",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={cn("dark", "font-sans", geist.variable, cinzel.variable)}>
      <body className="min-h-dvh antialiased">
        <AuthProvider>
          {children}
          <InstallPrompt />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
