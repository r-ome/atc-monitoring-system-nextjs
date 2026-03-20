"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { ReactNode } from "react";

interface ReportTab {
  value: string;
  label: string;
  content: ReactNode;
}

interface ReportTabsProps {
  tabs: ReportTab[];
  defaultValue?: string;
}

export const ReportTabs = ({ tabs, defaultValue }: ReportTabsProps) => {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
