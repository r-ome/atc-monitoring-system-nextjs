"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  CANCEL_REFUND_TAG_LABELS,
  CANCEL_REFUND_TAG_VALUES,
  CancelRefundTag,
  inferCancelRefundTag,
} from "src/entities/models/InventoryHistoryRemark";

interface CancelRefundTagSelectProps {
  reason: string;
  name?: string;
  disabled?: boolean;
}

export const CancelRefundTagSelect: React.FC<CancelRefundTagSelectProps> = ({
  reason,
  name = "tag",
  disabled,
}) => {
  const inferred = useMemo(() => inferCancelRefundTag(reason), [reason]);
  const [tag, setTag] = useState<CancelRefundTag>(inferred);
  const [overridden, setOverridden] = useState(false);

  useEffect(() => {
    if (!overridden) setTag(inferred);
  }, [inferred, overridden]);

  useEffect(() => {
    if (!reason.trim()) {
      setOverridden(false);
      setTag(inferred);
    }
  }, [reason, inferred]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium">Tag</Label>
        {!overridden && (
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            Auto
          </Badge>
        )}
      </div>
      <input type="hidden" name={name} value={tag} />
      <Select
        value={tag}
        onValueChange={(value) => {
          setTag(value as CancelRefundTag);
          setOverridden(true);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CANCEL_REFUND_TAG_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {CANCEL_REFUND_TAG_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
