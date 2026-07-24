// BreadcrumbList JSON-LD builder — shared helper so every SEO page
// declares breadcrumbs the same way. Google renders these as the
// breadcrumb trail above the URL in search results (e.g.
// "amiup.io › Learn › CLV" instead of just the raw URL), which
// increases visual real estate and click-through rate at no risk.
//
// Usage in a page:
//   const crumbs = buildBreadcrumbList([
//     { name: "Am I Up", url: "https://amiup.io" },
//     { name: "Learn",   url: "https://amiup.io/learn" },
//     { name: "CLV",     url: "https://amiup.io/learn/clv" },
//   ]);
//   ...
//   <script type="application/ld+json"
//     dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
