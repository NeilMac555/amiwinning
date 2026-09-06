import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
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

// IBM Plex Sans: primary sans of the terminal-dark theme. Chosen for the
// Bloomberg/trading-terminal aesthetic — geometric, low-personality,
// designed for dense information display. Self-hosted via next/font so
// there are no runtime Google CDN calls.
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
  weight: ["400", "500", "600"],
});

// SEO-tuned shared strings. The title leads with the brand (people
// searching "Am I Up" find us instantly) followed by the keyword
// phrase Google + AI engines actually care about: "bet tracker"
// qualified by "free" and "AI". Kept under 60 chars so it doesn't
// truncate in Google SERP. Description is under 160 chars for the
// same reason, packed with the wedge ("paste anything"), the
// surface (screenshots, X posts), and the value props (CLV, equity,
// profile, free).
const SEO_TITLE = "Free Bet Tracker – Track Bets with AI | Am I Up";
const SEO_DESCRIPTION =
  "Track your bets for free with Am I Up. Import screenshots, bookmaker text or spreadsheets. See profit, loss and yield. No credit card required.";

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
    description: SEO_DESCRIPTION,
  },
  // Search-console / webmaster verification. Next emits this as
  // <meta name="google-site-verification" content="..."> inside <head>.
  // Adding this means Google Search Console can confirm we own
  // amiup.io and start indexing performance/queries data for us.
  verification: {
    google: "ztVlj-Dm3m2YdPKf2dnRt18hnP1mF7I3VqabKF3Hp3M",
  },
  // Advertise the llms.txt LLM-discovery file via a link-alternate header
  // so crawlers that don't probe /llms.txt directly (some Perplexity /
  // ChatGPT variants use rel="alternate" hints) can still find it.
  // The full-content companion file is llms-full.txt.
  //
  // Also: default canonical points at the landing page. This is the
  // fallback for the "/" route (client component so can't declare its
  // own metadata) and for any other route that doesn't explicitly set
  // one. Every public SEO page (/learn/*, /compare/*, /partners, /terms,
  // /privacy, /u/*) overrides alternates entirely with its own canonical
  // pointing at itself — Next merges metadata shallowly, so the whole
  // alternates block replaces this one on those pages. Signed-in /
  // internal routes (/bets, /analytics, /import, /settings, /sign-in,
  // etc.) inherit canonical="/" but are all in robots.txt disallow so
  // they're never crawled and it doesn't matter.
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": "/llms.txt",
    },
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
    "CSV and Excel bet imports",
  ],
  creator: {
    "@type": "Person",
    // @id resolves to the Person entity defined on /author/neil-
    // macdonald. Every /learn Article JSON-LD uses the same @id, so
    // Google + AI answer engines see one coherent Person node
    // authored by us across the whole site (E-E-A-T entity graph).
    "@id": "https://amiup.io/author/neil-macdonald#person",
    name: "Neil Macdonald",
    url: "https://amiup.io/author/neil-macdonald",
    // sameAs links Neil to his verifiable off-site identity — Google
    // + AI answer engines use these edges to build a confidence
    // graph around who the author actually is. A page authored by
    // "Neil Macdonald, whose X profile is @NeilMac555 and whose
    // GitHub is NeilMac555" gets cited far more readily than
    // "amiup.io says." Add real accounts here only; a broken sameAs
    // is worse than none.
    sameAs: [
      "https://x.com/NeilMac555",
      "https://github.com/NeilMac555",
      "https://amiup.io/neilmac555",
    ],
  },
  // Publisher block — the same entity graph but framed as the
  // Organization that runs the site. Google's E-E-A-T signals lean
  // on both the creator and the publisher having verifiable social
  // presence. sameAs mirrors the creator's for now (one-person
  // operation); expand if the team grows.
  publisher: {
    "@type": "Organization",
    name: "Am I Up",
    url: "https://amiup.io",
    sameAs: [
      "https://x.com/NeilMac555",
      "https://github.com/NeilMac555",
    ],
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
      className={`${sans.variable} ${jetbrainsMono.variable} ${ibmPlex.variable}`}
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
