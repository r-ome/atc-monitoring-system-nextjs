export function auctionStartFixture(branchId = "branch-a") {
  const date = new Date("2026-10-17T00:00:00.000Z");
  const branch = { branch_id: branchId, name: "Test Branch", created_at: date, updated_at: date, deleted_at: null };
  const auction = {
    auction_id: "test-auction", branch_id: branchId, created_at: date, updated_at: date, deleted_at: null,
    branch, registered_bidders: [],
  };
  return { branch, auction };
}
