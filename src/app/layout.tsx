import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist, Cinzel } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Ma Sói",
  description: "Ma sói chơi cùng bàn hoặc từ xa",
  manifest: "/manifest.webmanifest",
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
        </AuthProvider>
      </body>
    </html>
  );
}
