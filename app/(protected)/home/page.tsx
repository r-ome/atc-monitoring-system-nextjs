import { PageContainer } from "@/app/components/PageContainer";
import { HomeHero } from "./components/HomeHero";
import { UnpaidBiddersCard } from "./components/UnpaidBiddersCard";
import { ContainersDueCard } from "./components/ContainersDueCard";
import { HomeCalendar } from "./components/HomeCalendar";
import { OverdueUnpaidBiddersReminder } from "./components/OverdueUnpaidBiddersReminder";

const Page = async () => {
  return (
    <PageContainer>
      <HomeHero />
      <OverdueUnpaidBiddersReminder />

      {/* Action tiles: Unpaid Bidders (wider) + Containers Due */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.45fr_1fr]">
        <UnpaidBiddersCard />
        <ContainersDueCard />
      </div>

      <HomeCalendar />
    </PageContainer>
  );
};

export default Page;
