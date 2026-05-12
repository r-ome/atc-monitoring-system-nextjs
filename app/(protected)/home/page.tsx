import { HomeHero } from "./components/HomeHero";
import { UnpaidBiddersCard } from "./components/UnpaidBiddersCard";
import { ContainersDueCard } from "./components/ContainersDueCard";
import { HomeCalendar } from "./components/HomeCalendar";

const Page = async () => {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-[18px]">
      <HomeHero />

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
