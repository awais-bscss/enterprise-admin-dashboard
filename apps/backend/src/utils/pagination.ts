export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePaginationParams(
  query: Record<string, unknown>,
  defaults: { limit?: number; maxLimit?: number } = {},
): { page: number; limit: number } {
  const defaultLimit = defaults.limit ?? 10;
  const maxLimit = defaults.maxLimit ?? 100;

  const rawPage = Number(query.page ?? 1);
  const page = Number.isFinite(rawPage) ? Math.max(Math.trunc(rawPage), 1) : 1;

  const rawLimit = Number(query.limit ?? defaultLimit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), maxLimit)
    : defaultLimit;

  return { page, limit };
}

export function resolvePaginationWindow(
  requestedPage: number,
  limit: number,
  total: number,
): { skip: number; pagination: PaginationMeta } {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const skip = (page - 1) * limit;
  return {
    skip,
    pagination: { page, limit, total, totalPages },
  };
}

/**
 * Fetches a paginated slice, running page 1's item query alongside the count in
 * parallel because skip is guaranteed to be 0 before clamping.
 */
export async function resolvePaginatedItems<T>(
  requestedPage: number,
  limit: number,
  totalPromise: Promise<number>,
  fetchSlice: (skip: number) => Promise<T[]>,
): Promise<{ items: T[]; pagination: PaginationMeta }> {
  if (requestedPage === 1) {
    const [total, items] = await Promise.all([totalPromise, fetchSlice(0)]);
    const { pagination } = resolvePaginationWindow(1, limit, total);
    return { items, pagination };
  }

  const total = await totalPromise;
  const { skip, pagination } = resolvePaginationWindow(requestedPage, limit, total);
  const items = await fetchSlice(skip);
  return { items, pagination };
}
