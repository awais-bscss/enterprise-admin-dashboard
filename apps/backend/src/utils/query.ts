import type { Model } from "mongoose";

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Count active and inactive documents in one DB query.
export async function summarizeActiveStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
): Promise<{ total: number; active: number; inactive: number }> {
  const rows = await model.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  let active = 0;
  let inactive = 0;
  for (const row of rows) {
    if (row._id === "active") active += row.count;
    else if (row._id === "inactive") inactive += row.count;
  }

  return {
    total: active + inactive,
    active,
    inactive,
  };
}
