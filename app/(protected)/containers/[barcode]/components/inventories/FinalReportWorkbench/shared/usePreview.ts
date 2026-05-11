import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getFinalReportPreview } from "@/app/(protected)/containers/actions";
import type {
  FinalReportPreview,
  FinalReportOptionsInput,
} from "src/entities/models/FinalReport";

export const usePreview = (barcode: string) => {
  const [preview, setPreview] = useState<FinalReportPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (
      options: Omit<FinalReportOptionsInput, "barcode">,
    ): Promise<FinalReportPreview | null> => {
      setLoading(true);
      try {
        const res = await getFinalReportPreview({ barcode, ...options });
        if (!res.ok) {
          toast.error(res.error.message, {
            description:
              typeof res.error.cause === "string" ? res.error.cause : undefined,
          });
          return null;
        }
        setPreview(res.value);
        return res.value;
      } finally {
        setLoading(false);
      }
    },
    [barcode],
  );

  const reset = useCallback(() => setPreview(null), []);

  return { preview, loading, refresh, reset };
};
