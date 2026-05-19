"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { ReactNode, useEffect, useRef, useState } from "react";
import { logReportTabView } from "../actions";

interface ReportTab {
  value: string;
  label: string;
  content: ReactNode;
}

interface ReportTabsProps {
  tabs: ReportTab[];
  defaultValue?: string;
}

const VIEW_DEDUPE_MS = 30_000;

export const ReportTabs = ({ tabs, defaultValue }: ReportTabsProps) => {
  const initial = defaultValue ?? tabs[0]?.value ?? "";
  const [active, setActive] = useState(initial);
  const lastLogged = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    const tab = tabs.find((t) => t.value === active);
    if (!tab) return;
    const now = Date.now();
    if (
      lastLogged.current &&
      lastLogged.current.value === tab.value &&
      now - lastLogged.current.at < VIEW_DEDUPE_MS
    ) {
      return;
    }
    lastLogged.current = { value: tab.value, at: now };
    void logReportTabView(tab.value, tab.label);
  }, [active, tabs]);

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList variant="page">
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
