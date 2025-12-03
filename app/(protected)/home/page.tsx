import { BirthdatesTable } from "@/app/(protected)/home/components/BidderBirthdatesTable/BirthdatesTable";
import { ContainersDueDateTable } from "./components/ContainersTable/ContainersDueDateTable";

const Page = async () => {
  return (
    <div className="">
      <div className="flex gap-2">
        <div className="w-3/5">
          <BirthdatesTable />
        </div>
        <div className="w-2/5 h-fit">
          <ContainersDueDateTable />
        </div>
      </div>
    </div>
  );
};

export default Page;
