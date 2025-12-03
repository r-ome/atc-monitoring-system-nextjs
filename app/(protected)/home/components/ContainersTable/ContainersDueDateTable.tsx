"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
// import { CoreRow } from "@tanstack/react-table";
import { columns } from "./containers-due-date-columns";
import { ContainerDueDate } from "src/entities/models/Container";
import { getContainersDueDate } from "@/app/(protected)/home/actions";

export const ContainersDueDateTable = () => {
  const [containers, setContainers] = useState<ContainerDueDate[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getContainersDueDate();
      if (!result.ok) return "what";

      setContainers(result.value);
    };
    fetchInitialData();
  }, []);

  return (
    <>
      <DataTable
        title={<div className="text-xl font-bold">Containers Due Date</div>}
        columns={columns}
        data={containers}
      />
    </>
  );
};
