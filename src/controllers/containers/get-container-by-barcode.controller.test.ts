import test from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "@prisma/client";
import { presentContainerDetails } from "./get-container-by-barcode.controller";
import { ContainerWithDetailsRow } from "src/entities/models/Container";

test("presentContainerDetails includes derived paid date and status", () => {
  const result = presentContainerDetails({
    container_id: "container-1",
    supplier_id: "supplier-1",
    branch_id: "branch-1",
    barcode: "32-04",
    bill_of_lading_number: null,
    container_number: null,
    arrival_date: null,
    due_date: null,
    gross_weight: null,
    auction_or_sell: "SELL",
    status: new Date("2026-05-02T00:00:00.000Z"),
    duties_and_taxes: new Prisma.Decimal(0),
    created_at: new Date("2026-05-01T00:00:00.000Z"),
    updated_at: new Date("2026-05-01T00:00:00.000Z"),
    deleted_at: null,
    branch: { branch_id: "branch-1", name: "Main" },
    supplier: {
      supplier_id: "supplier-1",
      supplier_code: "SUP-1",
      name: "Supplier",
      sales_remittance_account: "ATC",
    },
    container_files: [
      {
        container_file_id: "final-original-3",
        container_id: "container-1",
        document_type: "FINAL_REPORT_ORIGINAL",
        version: 3,
        original_filename: "original.xlsx",
        s3_bucket: "container-reports",
        s3_key: "original.xlsx",
        content_type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size_bytes: 3000,
        uploaded_by: "jerome",
        uploaded_at: new Date("2026-05-04T00:00:00.000Z"),
        deleted_by: null,
        deleted_at: null,
        created_at: new Date("2026-05-04T00:00:00.000Z"),
        updated_at: new Date("2026-05-04T00:00:00.000Z"),
      },
      {
        container_file_id: "final-modified-3",
        container_id: "container-1",
        document_type: "FINAL_REPORT_MODIFIED",
        version: 3,
        original_filename: "modified.xlsx",
        s3_bucket: "container-reports",
        s3_key: "modified.xlsx",
        content_type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size_bytes: 3500,
        uploaded_by: "jerome",
        uploaded_at: new Date("2026-05-04T00:00:00.000Z"),
        deleted_by: null,
        deleted_at: null,
        created_at: new Date("2026-05-04T00:00:00.000Z"),
        updated_at: new Date("2026-05-04T00:00:00.000Z"),
      },
      {
        container_file_id: "file-2",
        container_id: "container-1",
        document_type: "CONTAINER_REPORT",
        version: 2,
        original_filename: "report-v2.docx",
        s3_bucket: "container-reports",
        s3_key: "report-v2.docx",
        content_type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size_bytes: 2000,
        uploaded_by: "jerome",
        uploaded_at: new Date("2026-05-03T00:00:00.000Z"),
        deleted_by: null,
        deleted_at: null,
        created_at: new Date("2026-05-03T00:00:00.000Z"),
        updated_at: new Date("2026-05-03T00:00:00.000Z"),
      },
      {
        container_file_id: "file-1",
        container_id: "container-1",
        document_type: "CONTAINER_REPORT",
        version: 1,
        original_filename: "report-v1.docx",
        s3_bucket: "container-reports",
        s3_key: "report-v1.docx",
        content_type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size_bytes: 1000,
        uploaded_by: "jerome",
        uploaded_at: new Date("2026-05-02T00:00:00.000Z"),
        deleted_by: null,
        deleted_at: null,
        created_at: new Date("2026-05-02T00:00:00.000Z"),
        updated_at: new Date("2026-05-02T00:00:00.000Z"),
      },
    ],
    inventories: [],
  } as unknown as ContainerWithDetailsRow);

  assert.equal(result.status, "PAID");
  assert.equal(result.paid_at, "May 02, 2026");
  assert.deepEqual(
    result.container_report_files.map((file) => ({
      version: file.version,
      current: file.current,
    })),
    [
      { version: 2, current: true },
      { version: 1, current: false },
    ],
  );
  assert.equal(result.final_report_files?.version, 3);
  assert.equal(
    result.final_report_files?.original?.document_type,
    "FINAL_REPORT_ORIGINAL",
  );
  assert.equal(
    result.final_report_files?.modified?.document_type,
    "FINAL_REPORT_MODIFIED",
  );
});
