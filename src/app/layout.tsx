import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { MobileNavProvider } from "@/lib/mobile-nav";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Space Grotesk: industrial-geometric, distinct from the Inter/Geist default
// that every AI product ships with. Keeps the data-density we need while
// adding a small amount of editorial character.
const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Fraunces: variable serif with editorial feel. Used only for page titles
// and hero numbers — the "Bloomberg/FT" accent.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  // metadataBase lets Next.js resolve relative OG image paths (the
  // root opengraph-image.tsx and per-profile /u/[handle]/opengraph-
  // image.tsx) to absolute URLs that Twitter / Facebook can fetch.
  metadataBase: new URL("https://amiup.io"),
  title: {
    default: BRAND.fullTitle,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Track your bets, prove your edge, share results. A pro-grade bet tracker with closing-line value, equity curves, and shareable public profiles.",
  openGraph: {
    title: BRAND.fullTitle,
    description:
      "Track your bets, prove your edge, share results. A pro-grade bet tracker with closing-line value, equity curves, and shareable public profiles.",
    siteName: BRAND.name,
    type: "website",
    url: "https://amiup.io",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.fullTitle,
    description:
      "Track your bets, prove your edge, share results.",
  },
};

export const viewport: Viewport = {
  // device-width lets phones render at native scale instead of force-zooming
  // a 1480px desktop layout. Mobile-specific CSS in globals.css picks up at
  // 900px and again at 500px to reflow the layout for small viewports.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${sans.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
    >
      <body>
        <AuthProvider>
          <MobileNavProvider>{children}</MobileNavProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
