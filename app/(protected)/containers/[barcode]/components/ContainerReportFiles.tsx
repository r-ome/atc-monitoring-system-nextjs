"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2Icon, Trash, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  deleteContainerReportFile,
  getContainerReportDownloadUrl,
  uploadContainerReportFile,
} from "../../actions";
import type { ContainerReportFile } from "src/entities/models/ContainerFile";

type ContainerReportFilesProps = {
  container_id: string;
  files: ContainerReportFile[];
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const ContainerReportFiles: React.FC<ContainerReportFilesProps> = ({
  container_id,
  files,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(undefined);

    if (!selectedFile) {
      setErrors({ file: ["File is required!"] });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    const res = await uploadContainerReportFile(container_id, formData);
    setIsUploading(false);

    if (res.ok) {
      toast.success(res.value.message);
      setSelectedFile(null);
      setOpen(false);
      router.refresh();
      return;
    }

    const description =
      typeof res.error?.cause === "string" ? res.error.cause : null;
    toast.error(res.error.message, { description });
    if (res.error.message === "Invalid Data!") {
      setErrors(res.error.cause as Record<string, string[]>);
    }
  };

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

  const handleDelete = async (container_file_id: string) => {
    setDeletingId(container_file_id);
    const res = await deleteContainerReportFile(container_file_id);
    setDeletingId(null);

    if (res.ok) {
      toast.success(res.value.message);
      router.refresh();
      return;
    }

    const description =
      typeof res.error?.cause === "string" ? res.error.cause : null;
    toast.error(res.error.message, { description });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Container Report Files</h3>
          <p className="text-xs text-muted-foreground">
            {files.length ? `${files.length} version(s)` : "No reports uploaded"}
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Upload />
          Upload
        </Button>
      </div>

      {files.length ? (
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.container_file_id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">v{file.version}</span>
                    {file.current && <Badge>Current</Badge>}
                    <span className="truncate text-sm">
                      {file.original_filename}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size_bytes)} - Uploaded{" "}
                    {file.uploaded_at} by {file.uploaded_by || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
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
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(file.container_file_id)}
                    disabled={deletingId === file.container_file_id}
                  >
                    {deletingId === file.container_file_id ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Trash />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Upload a .docx container report to create v1.
        </div>
      )}

      <Dialog open={open}>
        <DialogContent className="w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Container Report</DialogTitle>
            <DialogDescription>
              Upload a .docx file as the next report version.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="container-report-file">Report file</Label>
              <Input
                id="container-report-file"
                name="file"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setErrors(undefined);
                }}
              />
              {errors?.file?.map((error) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setSelectedFile(null);
                    setErrors(undefined);
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2Icon className="animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};
