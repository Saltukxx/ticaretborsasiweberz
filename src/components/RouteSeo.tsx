import { useLocation } from "react-router-dom";
import { isDetailPath, lookupStaticSeo } from "../lib/seo/routes";
import GlobalSchema from "./GlobalSchema";
import SeoHead from "./SeoHead";

/** Applies static per-route SEO; detail pages override with their own SeoHead. */
export default function RouteSeo() {
  const { pathname } = useLocation();

  if (isDetailPath(pathname)) {
    return <GlobalSchema />;
  }

  const entry = lookupStaticSeo(pathname) ?? lookupStaticSeo("/");
  if (!entry) return <GlobalSchema />;

  return (
    <>
      <SeoHead title={entry.title} description={entry.description} path={pathname} />
      <GlobalSchema />
    </>
  );
}
