import Hero from "../components/Hero";
import EventsPreview from "../components/EventsPreview";
import HomeHumanStoriesNews from "../components/HomeHumanStoriesNews";
import HomePresidentBand from "../components/HomePresidentBand";
import QuickStats from "../components/QuickStats";
import {
  HomeCorporateCta,
  HomePriceSummary,
  HomeServicesShortcuts,
} from "../components/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomePresidentBand />
      <HomeHumanStoriesNews />
      <EventsPreview variant="home" />
      <QuickStats />
      <HomePriceSummary />
      <HomeServicesShortcuts />
      <HomeCorporateCta />
    </>
  );
}
