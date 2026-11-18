import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { clientsService, departmentsService, usersService } from '../services/apiService';
import type { ClientItem, ClientRef, DepartmentItem, DepartmentRef } from '../types/auth';

export function useActiveDepartments(savedRef?: DepartmentRef | null): DepartmentItem[] {
  const query = useQuery({
    queryKey: queryKeys.departments.list({ q: '', status: 'active', page: 1, limit: 100 }),
    queryFn: ({ signal }) => departmentsService.list({ status: 'active', limit: 100, signal }),
  });

  return useMemo(() => {
    const active = query.data?.departments ?? [];
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
  }, [query.data?.departments, savedRef]);
}

export function useActiveClients(savedRef?: ClientRef | null): ClientItem[] {
  const query = useQuery({
    queryKey: queryKeys.clients.list({ q: '', status: 'active', page: 1, limit: 100 }),
    queryFn: ({ signal }) => clientsService.list({ status: 'active', limit: 100, signal }),
  });

  return useMemo(() => {
    const active = query.data?.clients ?? [];
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
  }, [query.data?.clients, savedRef]);
}

export function useActiveEmployees(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.users.list({
      q: '',
      role: '',
      status: 'active',
      departmentId: '',
      page: 1,
      limit: 100,
    }),
    queryFn: ({ signal }) => usersService.list({ status: 'active', limit: 100, signal }),
    enabled,
  });
  return query.data?.users ?? [];
}
