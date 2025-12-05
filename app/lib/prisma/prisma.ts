import { PrismaClient } from "@prisma/client";
import { RequestContext } from "./RequestContext";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const base =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

const MODELS_WITH_BRANCH = new Set(["bidders"]);

const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = RequestContext.getStore();
        if (!ctx) return query(args);

        const { branch_id } = ctx;

        const opsWithWhere: Array<typeof operation> = ["findMany", "findFirst"];

        if (opsWithWhere.includes(operation)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentWhere = (args as any).where ?? {};

          const hasExistingWhere =
            currentWhere && Object.keys(currentWhere).length > 0;

          const AND: Record<string, string>[] = [];

          if (hasExistingWhere) {
            AND.push(currentWhere);
          }

          if (
            branch_id !== "31d71536-2a70-4087-ab7e-155ce3e23815" &&
            MODELS_WITH_BRANCH.has(model)
          ) {
            AND.push({ branch_id });
          }

          if (AND.length > 0) {
            return query({
              ...args,
              where: { AND },
            });
          }
        }

        // const opsWithData = [
        //   "create",
        //   "createMany",
        //   "update",
        //   "updateMany",
        //   "upsert",
        // ];
        // if (opsWithData.includes(operation)) {
        //   if ("data" in args && args.data) {
        //     if (
        //       branch_id !== null &&
        //       MODELS_WITH_BRANCH.has(model) &&
        //       !("branch_id" in args.data)
        //     ) {
        //       (args.data as any).branch_id = branch_id;
        //     }
        //   }
        // }

        return query(args);
      },
    },
  },
});

export default prisma;
