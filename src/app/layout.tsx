import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
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
  title: {
    default: BRAND.fullTitle,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.fullTitle,
  openGraph: {
    title: BRAND.fullTitle,
    description: BRAND.fullTitle,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.fullTitle,
    description: BRAND.fullTitle,
  },
};

export const viewport: Viewport = {
  width: 1480,
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
