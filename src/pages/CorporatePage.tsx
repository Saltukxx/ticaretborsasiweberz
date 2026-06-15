import PageHero from "../components/PageHero";
import CorporateSection from "../components/CorporateSection";
import CorporateDocumentsSection from "../components/CorporateDocumentsSection";
import CorporateLeadershipTeaser from "../components/CorporateLeadershipTeaser";
import RegionalMap from "../components/RegionalMap";
import { useCorporate } from "../hooks/usePublicApi";
import { formatDisplayHeading } from "../lib/formatDisplayHeading";

const FALLBACK_INTRO =
  "80 yılı aşkın kurumsal birikimle bölgemizin üretim, ticaret ve piyasa yapısına güvenilir kurumsal altyapı sunuyoruz.";

export default function CorporatePage() {
  const { data, isLoading, isError } = useCorporate();
  const profile = data?.profile;
  const { lead: headingLead, emphasis: headingEmphasis } = formatDisplayHeading(profile?.heading);

  const intro = isLoading
    ? FALLBACK_INTRO
    : isError
      ? "Kurumsal içerik şu an yüklenemedi. Aşağıdaki bölümlerde varsayılan bilgiler gösterilebilir."
      : profile?.lead ?? FALLBACK_INTRO;

  return (
    <>
      <PageHero
        breadcrumb="Kurumsal"
        eyebrow={profile?.eyebrow ?? "Kurumsal · 1946'dan Beri"}
        title={
          headingEmphasis ? (
            <>
              {headingLead} <em>{headingEmphasis}</em>
            </>
          ) : (
            headingLead
          )
        }
        intro={intro}
      />
      <CorporateSection showLeadershipCta={false} />
      <CorporateDocumentsSection />
      <CorporateLeadershipTeaser />
      <RegionalMap />
    </>
  );
}
