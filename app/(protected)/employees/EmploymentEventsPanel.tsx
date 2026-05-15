"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { getEmploymentEvents, addEmploymentEvent, deleteEmploymentEvent } from "./actions";
import { EMPLOYMENT_EVENT_TYPE } from "src/entities/models/EmploymentEvent";
import type { EmploymentEvent } from "src/entities/models/EmploymentEvent";

const EVENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RESIGNED: "destructive",
  TERMINATED: "destructive",
  AWOL: "destructive",
  END_OF_CONTRACT: "secondary",
  REHIRED: "default",
  RECALLED: "default",
};

interface Props {
  employeeId: string;
  isAdmin: boolean;
}

export const EmploymentEventsPanel: React.FC<Props> = ({ employeeId, isAdmin }) => {
  const router = useRouter();
  const [events, setEvents] = useState<EmploymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState(EMPLOYMENT_EVENT_TYPE[0]);

  const fetchEvents = useCallback(async () => {
    const res = await getEmploymentEvents(employeeId);
    if (res.ok) setEvents(res.value);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("employee_id", employeeId);
    fd.set("event_type", eventType);
    setAdding(true);
    try {
      const res = await addEmploymentEvent(fd);
      if (res.ok) {
        toast.success("Event added");
        setShowForm(false);
        router.refresh();
        fetchEvents();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (event_id: string) => {
    if (!confirm("Delete this event?")) return;
    setDeleting(event_id);
    try {
      const res = await deleteEmploymentEvent(event_id);
      if (res.ok) {
        toast.success("Deleted");
        fetchEvents();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading…</p>;

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No employment events recorded.</p>
      )}
      {events.map((ev) => (
        <div key={ev.event_id} className="flex items-start gap-2 rounded-md border p-2">
          <Badge variant={EVENT_VARIANT[ev.event_type] ?? "secondary"} className="text-xs mt-0.5">
            {ev.event_type.replace(/_/g, " ")}
          </Badge>
          <div className="flex-1 text-sm">
            <span className="font-medium">{ev.effective_date}</span>
            {ev.remarks && <p className="text-muted-foreground text-xs">{ev.remarks}</p>}
          </div>
          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive"
              disabled={deleting === ev.event_id}
              onClick={() => handleDelete(ev.event_id)}
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {isAdmin && (
        <>
          {!showForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <PlusIcon className="h-3 w-3 mr-1" /> Add Event
            </Button>
          ) : (
            <form onSubmit={handleAdd} className="rounded-md border p-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Event Type</Label>
                  <Select value={eventType} onValueChange={(v: typeof eventType) => setEventType(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {EMPLOYMENT_EVENT_TYPE.map((t) => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Effective Date</Label>
                  <Input type="date" name="effective_date" required className="text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Remarks</Label>
                <Textarea name="remarks" rows={2} className="text-xs" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={adding}>
                  {adding && <Loader2Icon className="h-3 w-3 animate-spin mr-1" />}
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};
