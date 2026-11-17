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
