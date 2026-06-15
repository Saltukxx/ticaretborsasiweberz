import { absoluteUrl, pageUrl, SITE_NAME, SITE_URL } from "./siteUrl";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["ETB", "Erzurum TB"],
    url: SITE_URL,
    logo: absoluteUrl("/erzurum-ticaret-borsasi-logo.png"),
    email: "bilgi@etb.org.tr",
    telephone: "+90-442-234-5678",
    foundingDate: "1946",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Muratpaşa Mah. Cemal Gürsel Cad. No: 13",
      addressLocality: "Yakutiye",
      addressRegion: "Erzurum",
      addressCountry: "TR",
    },
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "tr-TR",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl("/erzurum-ticaret-borsasi-logo.png"),
    telephone: "+90-442-234-5678",
    email: "bilgi@etb.org.tr",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Muratpaşa Mah. Cemal Gürsel Cad. No: 13",
      addressLocality: "Yakutiye",
      postalCode: "25000",
      addressRegion: "Erzurum",
      addressCountry: "TR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:30",
      },
    ],
  };
}

export type ArticleSchemaInput = {
  headline: string;
  description: string;
  path: string;
  datePublished?: string | null;
  dateModified?: string | null;
  imageUrl?: string | null;
};

export function articleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    url: pageUrl(input.path),
    inLanguage: "tr-TR",
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    image: input.imageUrl
      ? [input.imageUrl]
      : [absoluteUrl("/erzurum-ticaret-borsasi-logo.png")],
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/erzurum-ticaret-borsasi-logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl(input.path),
    },
  };
}

export function globalSchemaGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationSchema(), websiteSchema(), localBusinessSchema()],
  };
}
