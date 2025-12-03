"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContainerIcon } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./containers-due-date-columns";
import { ContainerDueDate } from "src/entities/models/Container";
import { getContainersDueDate } from "@/app/(protected)/home/actions";

export const ContainersDueDateTable = () => {
  const router = useRouter();
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
        title={
          <div className="flex gap-2 items-center">
            <ContainerIcon />
            <div className="text-xl font-bold">Containers Due Date</div>
          </div>
        }
        onRowClick={(container) =>
          router.push(`/containers/${container.barcode}`)
        }
        columns={columns}
        data={containers}
      />
    </>
  );
};
