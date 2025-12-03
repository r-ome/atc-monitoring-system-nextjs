import { BirthdatesTable } from "@/app/(protected)/home/components/BidderBirthdatesTable/BirthdatesTable";
import { ContainersDueDateTable } from "./components/ContainersTable/ContainersDueDateTable";
import { UnpaidBiddersTable } from "./components/UnpaidBiddersTable/UnpaidBiddersTable";

const Page = async () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="w-3/5">
          <BirthdatesTable />
        </div>
        <div className="w-2/5 h-fit">
          <UnpaidBiddersTable />
        </div>
      </div>
      <div className="flex">
        <ContainersDueDateTable />
      </div>
    </div>
  );
};

export default Page;
