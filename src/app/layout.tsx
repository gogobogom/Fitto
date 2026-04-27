import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Caveat, Architects_Daughter } from "next/font/google";
import "./globals.css";

import { cookies } from "next/headers";

import { ResponseLogger } from "@/components/response-logger";
import { ReadyNotifier } from "@/components/ready-notifier";
import FarcasterWrapper from "@/components/FarcasterWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import MaintenanceWrapper from "@/components/MaintenanceWrapper";
import { PWAProvider } from "@/components/pwa";
import { RevenueCatInitializer } from "@/components/RevenueCatInitializer";

/* ---------------- Fonts ---------------- */

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
});

const architectsDaughter = Architects_Daughter({
  subsets: ["latin"],
  variable: "--font-architects",
  weight: "400",
});

/* ---------------- Root Layout ---------------- */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next.js 15: cookies() ASYNC olmak zorunda
  const cookieStore = await cookies();
  const requestId = cookieStore.get("x-request-id")?.value;

  return (
    <html lang="tr">
      <head>
        {requestId && <meta name="x-request-id" content={requestId} />}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${architectsDaughter.variable} antialiased overflow-x-hidden min-h-screen`}
      >
        {/* MiniApp ready sinyali – dokunma */}
        <ReadyNotifier />

        {/* RevenueCat web’de pasif çalışır, sorun değil */}
        <RevenueCatInitializer />

        <LanguageProvider>
          <FarcasterWrapper>
            <MaintenanceWrapper>
              <PWAProvider>{children}</PWAProvider>
            </MaintenanceWrapper>
          </FarcasterWrapper>
        </LanguageProvider>

        <Toaster />
        <ResponseLogger />
      </body>
    </html>
  );
}

/* ---------------- Metadata ---------------- */

export const metadata: Metadata = {
  title: "Fitto - AI Nutrition & Fitness Coach",
  description:
    "Your personal AI-powered nutrition and fitness coach. Track meals, log workouts, and achieve your health goals.",
  keywords: [
    "nutrition",
    "fitness",
    "health",
    "kalori",
    "beslenme",
    "spor",
  ],
  authors: [{ name: "Fitto Team" }],
  creator: "Fitto",
  publisher: "Fitto",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fitto",
  },
  formatDetection: {
    telephone: false,
  },
};

/* ---------------- Viewport ---------------- */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
