"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { getContainerReportDownloadUrl } from "../../actions";
import type {
  FinalReportFile,
  FinalReportFilePair,
} from "src/entities/models/ContainerFile";

type GeneratedFinalReportFilesProps = {
  files: FinalReportFilePair | null;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const VARIANT_LABELS: Record<FinalReportFile["variant"], string> = {
  original: "Original",
  modified: "Modified",
};

export const GeneratedFinalReportFiles = ({
  files,
}: GeneratedFinalReportFilesProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const visibleFiles = [files?.original, files?.modified].filter(
    (file): file is FinalReportFile => Boolean(file),
  );

  const handleDownload = async (container_file_id: string) => {
    setDownloadingId(container_file_id);
    const res = await getContainerReportDownloadUrl(container_file_id);
    setDownloadingId(null);

    if (res.ok) {
      window.location.href = res.value.url;
      return;
    }

    const description =
      typeof res.error?.cause === "string" ? res.error.cause : null;
    toast.error(res.error.message, { description });
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Generated Final Reports</h3>
        <p className="text-xs text-muted-foreground">
          {files
            ? `Latest generated pair: v${files.version}`
            : "No generated final reports"}
        </p>
      </div>

      {visibleFiles.length ? (
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {visibleFiles.map((file) => (
              <div
                key={file.container_file_id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                    <Badge variant="outline">
                      {VARIANT_LABELS[file.variant]}
                    </Badge>
                    <span className="font-medium">v{file.version}</span>
                    <span className="truncate text-sm">
                      {file.original_filename}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size_bytes)} - Generated{" "}
                    {file.uploaded_at} by {file.uploaded_by || "Unknown"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file.container_file_id)}
                  disabled={downloadingId === file.container_file_id}
                >
                  {downloadingId === file.container_file_id ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Finalize and generate a report to upload the latest Original and
          Modified Excel files.
        </div>
      )}
    </section>
  );
};
