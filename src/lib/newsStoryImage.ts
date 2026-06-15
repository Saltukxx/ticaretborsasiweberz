import type { PublicNewsItem } from "./publicApi";
import { resolveMediaUrl } from "./resolveMediaUrl";

export const NEWS_EDITORIAL_FALLBACK_IMAGES = [
  {
    src: "/images/haber-kurumsal-ziyaret.png",
    alt: "Erzurum Ticaret Borsası kurumsal ziyaret görüşmesi",
    label: "Kurumsal ziyaret",
  },
  {
    src: "/images/haber-meclis-toplantisi.png",
    alt: "Erzurum Ticaret Borsası toplantı salonunda meclis gündemi",
    label: "Meclis gündemi",
  },
  {
    src: "/images/haber-uye-bulusmasi.png",
    alt: "Erzurum Ticaret Borsası üye buluşması",
    label: "Üye buluşması",
  },
] as const;

export type NewsStoryImage = {
  src: string;
  alt: string;
  label: string;
};

/** Prefer API cover; fall back to editorial stock photos when cover is missing. */
export function newsStoryImage(item: PublicNewsItem, index: number): NewsStoryImage {
  if (item.coverUrl) {
    return {
      src: resolveMediaUrl(item.coverUrl),
      alt: item.title,
      label: item.category ?? "Haber",
    };
  }
  const fallback = NEWS_EDITORIAL_FALLBACK_IMAGES[index % NEWS_EDITORIAL_FALLBACK_IMAGES.length];
  return { src: fallback.src, alt: fallback.alt, label: fallback.label };
}
