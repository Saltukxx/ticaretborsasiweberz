import { Helmet } from "react-helmet-async";
import { articleSchema } from "../lib/seo/schema";
import {
  absoluteUrl,
  ALLOW_INDEXING,
  DEFAULT_OG_IMAGE,
  formatPageTitle,
  pageUrl,
  SITE_NAME,
} from "../lib/seo/siteUrl";

export type SeoHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
  article?: {
    path: string;
    datePublished?: string | null;
    dateModified?: string | null;
  };
};

export default function SeoHead({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  type = "website",
  article,
}: SeoHeadProps) {
  const pageTitle = formatPageTitle(title);
  const metaDescription =
    description?.trim() ||
    "Erzurum Ticaret Borsası — güncel fiyat bültenleri, piyasa verileri ve kurumsal hizmetler.";
  const canonical = pageUrl(path);
  const ogImage = absoluteUrl(image?.trim() || DEFAULT_OG_IMAGE);
  const shouldIndex = ALLOW_INDEXING && !noindex;

  const jsonLd =
    type === "article" && article && title
      ? articleSchema({
          headline: title,
          description: metaDescription,
          path: article.path,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          imageUrl: image ? ogImage : null,
        })
      : null;

  return (
    <Helmet>
      <html lang="tr" />
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      {!shouldIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
