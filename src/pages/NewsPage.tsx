import PageHero from "../components/PageHero";
import NewsEditorial from "../components/NewsEditorial";

export default function NewsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Haberler"
        eyebrow="İnsan · Bölge · Kurumsal Gündem"
        title={<>Borsadan <em>Haberler</em></>}
        intro="Erzurum Ticaret Borsası'ndan güncel gelişmeler, toplantılar, üye temasları ve sektörel haberler; gerçek fotoğraflarla desteklenen editoryal bir akış halinde."
      />
      <NewsEditorial />
    </>
  );
}
