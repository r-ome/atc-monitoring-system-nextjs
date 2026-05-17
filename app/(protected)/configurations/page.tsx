import { ConfigurationNavigation } from "./components/ConfigurationNavigation";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";

const Page = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Configurations"
        subtitle="System-wide settings and lookup data"
      />

      <ConfigurationNavigation />
    </PageContainer>
  );
};

export default Page;
