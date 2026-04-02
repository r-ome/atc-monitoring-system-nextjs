import { RequestContext } from "./RequestContext";
import { buildBranchWhere, SUPER_ADMIN_BRANCH } from "./prisma";

export function buildTenantWhere<TWhere extends Record<string, unknown>>(
  model: string,
  where: TWhere,
) {
  const ctx = RequestContext.getStore();

  if (!ctx || ctx.branch_id === SUPER_ADMIN_BRANCH) {
    return where;
  }

  return {
    AND: [where, buildBranchWhere(model, ctx.branch_id)],
  };
}
