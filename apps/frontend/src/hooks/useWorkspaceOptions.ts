import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { clientsService, departmentsService, usersService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { ClientItem, ClientRef, DepartmentItem, DepartmentRef } from '../types/auth';

const OPTION_PAGE_SIZE = 100;
const MAX_OPTION_PAGES = 10;

async function fetchAllPages<TPage extends { pagination: PaginationMeta }, TItem>(
  fetchPage: (page: number) => Promise<TPage>,
  extractItems: (pageData: TPage) => TItem[],
): Promise<TItem[]> {
  const firstPage = await fetchPage(1);
  const allItems = [...extractItems(firstPage)];
  const totalPages = Math.min(firstPage.pagination?.totalPages ?? 1, MAX_OPTION_PAGES);

  if (totalPages <= 1) {
    return allItems;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );
  for (const pageData of remainingPages) {
    allItems.push(...extractItems(pageData));
  }
  return allItems;
}

export function useActiveDepartments(savedRef?: DepartmentRef | null): DepartmentItem[] {
  const query = useQuery({
    queryKey: queryKeys.departments.list({
      q: '',
      status: 'active',
      page: 1,
      limit: OPTION_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchAllPages(
        (page) =>
          departmentsService.list({ status: 'active', page, limit: OPTION_PAGE_SIZE, signal }),
        (pageData) => pageData.departments,
      ),
  });

  return useMemo(() => {
    const active = query.data ?? [];
    if (!savedRef || active.some((d) => d.id === savedRef.id)) return active;
    return [
      {
        id: savedRef.id,
        name: savedRef.name,
        code: savedRef.code,
        headName: '',
        description: '',
        status: 'inactive',
        createdAt: '',
        updatedAt: '',
      },
      ...active,
    ];
  }, [query.data, savedRef]);
}

export function useActiveClients(savedRef?: ClientRef | null): ClientItem[] {
  const query = useQuery({
    queryKey: queryKeys.clients.list({
      q: '',
      status: 'active',
      page: 1,
      limit: OPTION_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchAllPages(
        (page) => clientsService.list({ status: 'active', page, limit: OPTION_PAGE_SIZE, signal }),
        (pageData) => pageData.clients,
      ),
  });

  return useMemo(() => {
    const active = query.data ?? [];
    if (!savedRef || active.some((c) => c.id === savedRef.id)) return active;
    return [
      {
        id: savedRef.id,
        name: savedRef.name,
        company: savedRef.company,
        email: '',
        phone: '',
        status: 'inactive',
        createdAt: '',
        updatedAt: '',
      },
      ...active,
    ];
  }, [query.data, savedRef]);
}

export function useActiveEmployees(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.users.list({
      q: '',
      role: '',
      status: 'active',
      departmentId: '',
      page: 1,
      limit: OPTION_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchAllPages(
        (page) => usersService.list({ status: 'active', page, limit: OPTION_PAGE_SIZE, signal }),
        (pageData) => pageData.users,
      ),
    enabled,
  });
  return query.data ?? [];
}
