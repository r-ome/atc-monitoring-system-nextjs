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

// base.$on("query", (e) => {
//   console.log("Query: " + e.query);
//   console.log("Params: " + e.params);
//   console.log("Duration: " + e.duration + "ms");
// });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BRANCH_FILTERS: Record<string, any> = {
  bidders: { branch_id: undefined },
  containers: { branch_id: undefined },
  auctions: { branch_id: undefined },
  auctions_bidders: { auctions: { branch_id: undefined } },
  auctions_inventories: {
    auction_bidder: {
      auctions: { branch_id: undefined },
    },
  },
  inventories: { container: { branch_id: undefined } },
  receipt_records: {
    auction_bidder: { auctions: { branch_id: undefined } },
  },
  payments: {
    receipt: {
      auction_bidder: { auctions: { branch_id: undefined } },
    },
  },
  manifest_records: { auction: { branch_id: undefined } },
  inventory_histories: { inventories: { branch_id: undefined } },
  expenses: { branch_id: undefined },
  petty_cash: { branch_id: undefined },
};

function buildBranchWhere(model: string, branch_id: string) {
  const template = BRANCH_FILTERS[model];
  if (!template) return {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deepClone = (obj: any) =>
    JSON.parse(
      JSON.stringify(obj, (_, v) => (v === undefined ? branch_id : v)),
    );

  return deepClone(template);
}

const SUPER_ADMIN_BRANCH = "31d71536-2a70-4087-ab7e-155ce3e23815";

const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = RequestContext.getStore();
        if (!ctx) return query(args);

        const { branch_id } = ctx;

        // super admin bypass
        if (branch_id === SUPER_ADMIN_BRANCH) return query(args);

        const modelHasBranch = BRANCH_FILTERS[model] !== undefined;
        const branchWhere = modelHasBranch
          ? buildBranchWhere(model, branch_id)
          : {};
        const shouldInjectBranchId =
          modelHasBranch && model !== "auctions_inventories";

        if (operation === "findMany" || operation === "findFirst") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const where = (args as any).where ?? {};
          return query({
            ...args,
            where: { AND: [where, branchWhere] },
          });
        }

        if (operation === "findUnique") {
          return query(args);
          // original
          // return query({
          //   ...args,
          //   where: {
          //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
          //     AND: [(args as any).where, branchWhere],
          //   },
          // });
        }

        if (operation === "update" || operation === "delete") {
          return query(args);

          // return query({
          //   ...args,
          //   where: {
          //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
          //     AND: [(args as any).where, branchWhere],
          //   },
          // });
        }

        if (operation === "updateMany" || operation === "deleteMany") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const where = (args as any).where ?? {};
          return query({
            ...args,
            where: {
              AND: [where, branchWhere],
            },
          });
        }

        if (operation === "create") {
          return query({
            ...args,
            data: {
              ...args.data,
              ...(shouldInjectBranchId && modelHasBranch ? { branch_id } : {}),
            },
          });
        }

        if (operation === "createMany") {
          const dataArray = Array.isArray(args.data) ? args.data : [];
          return query({
            ...args,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: dataArray.map((d: any) => ({
              ...d,
              ...(BRANCH_FILTERS[model].branch_id !== undefined
                ? { branch_id }
                : {}),
            })),
          });
        }

        return query(args);
      },
    },
  },
});

export async function tenantQuery({
  sql,
  table,
  params = [],
}: {
  sql: string;
  table: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[];
}) {
  const ctx = RequestContext.getStore();
  if (!ctx) throw new Error("Missing tenant context");

  const { branch_id } = ctx;
  if (branch_id === SUPER_ADMIN_BRANCH) {
    return prisma.$queryRawUnsafe(sql, ...params);
  }

  const branchClause = `${table}.branch_id = '${branch_id}'`;

  const upperSQL = sql.toUpperCase();
  let finalSQL = sql;
  if (upperSQL.includes("WHERE")) {
    finalSQL = sql.replace(/WHERE/i, `WHERE ${branchClause} AND `);

    return prisma.$queryRawUnsafe(finalSQL, ...params);
  }

  const keywords = ["GROUP BY", "HAVING", "ORDER BY", "LIMIT"];
  let inserted = false;

  for (const keyword of keywords) {
    const idx = upperSQL.indexOf(keyword);
    if (idx !== -1) {
      finalSQL = sql.slice(0, idx) + `WHERE ${branchClause}\n` + sql.slice(idx);
      inserted = true;
      break;
    }
  }

  if (inserted) {
    return prisma.$queryRawUnsafe(finalSQL, ...params);
  }
  finalSQL = `${sql}\nWHERE ${branchClause}`;
  return prisma.$queryRawUnsafe(finalSQL, ...params);
}

export default prisma;
