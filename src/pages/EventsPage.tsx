import PageHero from "../components/PageHero";
import EventsShowcase from "../components/EventsShowcase";

export default function EventsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Etkinlikler"
        eyebrow="Kurumsal Takvim · Planlanan Programlar"
        title={
          <>
            Borsanın Planlanan <em>Etkinlikleri</em>
          </>
        }
        intro="Üyeler, üreticiler ve sektör paydaşları için planlanan toplantılar, eğitimler, paneller ve saha buluşmalarına buradan göz atın; katılım ve bilgi için iletişim kanallarımızı kullanabilirsiniz."
      />
      <EventsShowcase />
    </>
  );
}
