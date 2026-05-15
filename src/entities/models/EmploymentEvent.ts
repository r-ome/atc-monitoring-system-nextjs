import { z } from "zod";
import { Prisma } from "@prisma/client";

export const EMPLOYMENT_EVENT_TYPE = [
  "RESIGNED",
  "TERMINATED",
  "AWOL",
  "END_OF_CONTRACT",
  "REHIRED",
  "RECALLED",
] as const;
export type EmploymentEventType = (typeof EMPLOYMENT_EVENT_TYPE)[number];

export type EmploymentEventRow = Prisma.employee_employment_eventsGetPayload<object>;

export type EmploymentEvent = {
  event_id: string;
  employee_id: string;
  event_type: EmploymentEventType;
  effective_date: string;
  remarks?: string | null;
  created_at: string;
};

export const createEmploymentEventSchema = z.object({
  employee_id: z.string().min(1),
  event_type: z.enum(EMPLOYMENT_EVENT_TYPE),
  effective_date: z.string().min(1),
  remarks: z.string().optional().nullable(),
});

export type CreateEmploymentEventInput = z.infer<typeof createEmploymentEventSchema>;
