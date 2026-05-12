import { HomeHero } from "./components/HomeHero";
import { UnpaidBiddersCard } from "./components/UnpaidBiddersCard";
import { ContainersDueCard } from "./components/ContainersDueCard";
import { HomeCalendar } from "./components/HomeCalendar";
import { OverdueUnpaidBiddersReminder } from "./components/OverdueUnpaidBiddersReminder";

const Page = async () => {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-[18px] 2xl:max-w-[1700px] 2xl:gap-6">
      <HomeHero />
      <OverdueUnpaidBiddersReminder />

      {/* Action tiles: Unpaid Bidders (wider) + Containers Due */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.45fr_1fr]">
        <UnpaidBiddersCard />
        <ContainersDueCard />
      </div>

      <HomeCalendar />
    </div>
  );
};

export default Page;
