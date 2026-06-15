import { useLayoutEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Hero from "../components/Hero";
import HomeAgendaMarquee from "../components/HomeAgendaMarquee";
import HomeCorporateClosing from "../components/HomeCorporateClosing";
import HomeHumanStoriesNews from "../components/HomeHumanStoriesNews";
import HomeLiveMarketMarquee from "../components/HomeLiveMarketMarquee";
import HomePresidentBand from "../components/HomePresidentBand";
import HomeProjectsPreview from "../components/HomeProjectsPreview";
import QuickStats from "../components/QuickStats";
import HomePartnersMarquee from "../components/HomePartnersMarquee";
import {
  HomePriceSummary,
  HomeServicesShortcuts,
} from "../components/HomeSections";
import { prefetchHomePulseQueries } from "../lib/prefetchHomePulse";

export default function HomePage() {
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    prefetchHomePulseQueries(queryClient);
  }, [queryClient]);

  return (
    <>
      <Hero />
      <HomePresidentBand />
      <HomeAgendaMarquee />
      <HomeHumanStoriesNews />
      <HomeProjectsPreview />
      <QuickStats />
      <HomeLiveMarketMarquee />
      <HomePriceSummary />
      <HomeServicesShortcuts />
      <HomePartnersMarquee />
      <HomeCorporateClosing />
    </>
  );
}
