/**
 * Static cover fallbacks for coğrafi işaretler until admin uploads covers.
 * Sources: Kültür Portalı product archive (same URLs as legacy atlas).
 */

export const GEO_FALLBACK_IMAGES_BY_SLUG: Record<string, string> = {
  "oltu-cag-kebabi":
    "https://www.kulturportali.gov.tr/repoKulturPortali/Dokumanlar/OltuCagKebabi_20180518112403950.jpg?format=jpg&quality=70",
  "ispir-fasulyesi":
    "https://www.kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502104432221_Ispir%20Fasulyesi.JPG?format=jpg&quality=70",
  "civil-peynir":
    "https://kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502104025194_Civil%20peynir.jpg?format=jpg&quality=70",
  "kadayif-dolmasi":
    "https://beta.kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502103415957_ERZURUM%20KADYIF%20DOLMASI%20Fotograf%20Murat%20OCAL%200543.JPG?format=jpg&quality=70",
  "oltu-tasi":
    "https://kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502100932192_ERZURUM%20OLTUSTASI%20TESPIH.jpg?format=jpg&quality=70",
};

const GEO_FALLBACK_IMAGES_BY_NAME: Record<string, string> = {
  "Oltu Cağ Kebabı": GEO_FALLBACK_IMAGES_BY_SLUG["oltu-cag-kebabi"],
  "Erzurum Oltu Cağ Kebabı": GEO_FALLBACK_IMAGES_BY_SLUG["oltu-cag-kebabi"],
  "İspir Fasulyesi": GEO_FALLBACK_IMAGES_BY_SLUG["ispir-fasulyesi"],
  "Erzurum İspir Fasulyesi": GEO_FALLBACK_IMAGES_BY_SLUG["ispir-fasulyesi"],
  "Civil Peynir": GEO_FALLBACK_IMAGES_BY_SLUG["civil-peynir"],
  "Erzurum Civil Peyniri": GEO_FALLBACK_IMAGES_BY_SLUG["civil-peynir"],
  "Kadayıf Dolması": GEO_FALLBACK_IMAGES_BY_SLUG["kadayif-dolmasi"],
  "Erzurum Kadayıf Dolması": GEO_FALLBACK_IMAGES_BY_SLUG["kadayif-dolmasi"],
  "Oltu Taşı": GEO_FALLBACK_IMAGES_BY_SLUG["oltu-tasi"],
  "Erzurum Oltu Taşı": GEO_FALLBACK_IMAGES_BY_SLUG["oltu-tasi"],
};

export function resolveGeoFallbackImage(slug: string, name?: string): string | null {
  const bySlug = GEO_FALLBACK_IMAGES_BY_SLUG[slug];
  if (bySlug) return bySlug;
  if (name) {
    const byName = GEO_FALLBACK_IMAGES_BY_NAME[name];
    if (byName) return byName;
  }
  return null;
}
