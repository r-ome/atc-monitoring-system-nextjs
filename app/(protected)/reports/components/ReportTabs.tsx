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
      <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border bg-secondary/60 p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="inline-flex h-auto shrink-0 flex-none items-center gap-2 whitespace-nowrap rounded-md border-transparent bg-transparent px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:px-3 sm:py-1.5 2xl:text-[15px]"
          >
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
