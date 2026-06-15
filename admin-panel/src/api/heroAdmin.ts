import { apiRequest, type ApiEnvelope } from "./http";

export type HeroKpi = {
  label: string;
  value: string;
  valueSuffix?: string;
  highlighted?: boolean;
};

export type HeroContent = {
  id: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  titleSuffix: string;
  titleTagline: string;
  description: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  ctaLinkLabel: string;
  ctaLinkHref: string;
  kpis: HeroKpi[];
  updatedAt: string;
};

export async function getHeroContentAdmin() {
  return apiRequest<ApiEnvelope<HeroContent>>("/api/v1/admin/hero");
}

export async function patchHeroContentAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<HeroContent>>("/api/v1/admin/hero", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
