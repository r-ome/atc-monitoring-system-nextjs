import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { ContainerRepository } from "./containers.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("updateContainerStatus saves a paid date", async () => {
  let capturedData: { status: Date | null } | undefined;

  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.containers,
      "update",
      (async ({ data }: { data: { status: Date | null } }) => {
        capturedData = data;
        return { container_id: "container-1", barcode: "32-04", ...data };
      }) as typeof prisma.containers.update,
    ),
  );

  await ContainerRepository.updateContainerStatus("container-1", "2026-05-02");

  assert.ok(capturedData?.status instanceof Date);
  assert.equal(capturedData.status.toISOString().slice(0, 10), "2026-05-02");
});

test("updateContainerStatus clears paid date when marked unpaid", async () => {
  let capturedData: { status: Date | null } | undefined;

  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.containers,
      "update",
      (async ({ data }: { data: { status: Date | null } }) => {
        capturedData = data;
        return { container_id: "container-1", barcode: "32-04", ...data };
      }) as typeof prisma.containers.update,
    ),
  );

  await ContainerRepository.updateContainerStatus("container-1", null);

  assert.deepEqual(capturedData, { status: null });
});
