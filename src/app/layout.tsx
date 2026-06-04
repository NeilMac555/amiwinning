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

// SEO-tuned shared strings. The title leads with the brand (people
// searching "Am I Up" find us instantly) followed by the keyword
// phrase Google + AI engines actually care about: "bet tracker"
// qualified by "free" and "AI". Kept under 60 chars so it doesn't
// truncate in Google SERP. Description is under 160 chars for the
// same reason, packed with the wedge ("paste anything"), the
// surface (screenshots, X posts), and the value props (CLV, equity,
// profile, free).
const SEO_TITLE = "Am I Up · Free AI Bet Tracker. Paste anything, log nothing.";
const SEO_DESCRIPTION =
  "Free AI bet tracker. Paste screenshots, X posts, bookmaker text. AI extracts every bet. CLV, equity curve, public profile. No credit card.";

export const metadata: Metadata = {
  // metadataBase lets Next.js resolve relative OG image paths (the
  // root opengraph-image.tsx and per-profile /u/[handle]/opengraph-
  // image.tsx) to absolute URLs that Twitter / Facebook can fetch.
  metadataBase: new URL("https://amiup.io"),
  title: {
    default: SEO_TITLE,
    template: `%s · ${BRAND.name}`,
  },
  description: SEO_DESCRIPTION,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    siteName: BRAND.name,
    type: "website",
    url: "https://amiup.io",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description:
      "Free AI bet tracker. Paste anything, log nothing. CLV, equity curve, public profile.",
  },
  // Search-console / webmaster verification. Next emits this as
  // <meta name="google-site-verification" content="..."> inside <head>.
  // Adding this means Google Search Console can confirm we own
  // amiup.io and start indexing performance/queries data for us.
  verification: {
    google: "ztVlj-Dm3m2YdPKf2dnRt18hnP1mF7I3VqabKF3Hp3M",
  },
};

// JSON-LD SoftwareApplication schema. Renders on every page and tells
// Google + ChatGPT + Claude + Perplexity + Gemini in machine-readable
// language exactly what Am I Up is, what it does, who it's for, what
// it costs. AI engines weight structured data heavily when deciding
// what to cite for "best bet tracker" style queries.
//
// Deliberately omitting aggregateRating until real reviews exist —
// faking a star count is a Google policy violation that can get the
// whole schema disregarded.
const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Am I Up",
  alternateName: ["Am I Up bet tracker", "amiup.io"],
  url: "https://amiup.io",
  description:
    "Free AI bet tracker for sports bettors. Paste anything — text, screenshots, X posts, bookmaker bet slips — and the AI extracts every bet into a structured row. Tracks closing-line value vs Pinnacle, equity curve, yield, ROC, win rate, max drawdown. Public profile for every user.",
  applicationCategory: "FinanceApplication",
  applicationSubCategory: "BetTracker",
  operatingSystem: "Web",
  browserRequirements: "Requires modern browser (Chrome, Safari, Firefox, Edge)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "AI paste parsing (text + screenshots)",
    "Closing line value vs Pinnacle close",
    "Equity curve and lifetime P/L",
    "Yield, ROC, win rate, max drawdown",
    "Breakdown by sport, market, odds range",
    "Public profile with shareable URL",
    "CSV export of all bets",
    "Multi-book support",
    "Six editorial themes",
  ],
  creator: {
    "@type": "Person",
    name: "Neil Macdonald",
    url: "https://amiup.io/u/neilmac555",
  },
  inLanguage: "en",
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
        {/* SoftwareApplication structured data — renders on every route
            so Google + AI engines have a consistent machine-readable
            description of Am I Up no matter which page they crawl. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SOFTWARE_APP_JSONLD),
          }}
        />
        <AuthProvider>
          <MobileNavProvider>{children}</MobileNavProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
