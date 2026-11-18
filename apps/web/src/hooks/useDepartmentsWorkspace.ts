import { queryKeys } from '../lib/queryKeys';
import { departmentsService } from '../services/apiService';
import { useEntityDirectory } from './useEntityDirectory';

export function useDepartmentsWorkspace() {
  return useEntityDirectory({
    scope: 'departments',
    noun: 'department',
    getQueryKey: queryKeys.departments.list,
    listFn: departmentsService.list,
    extractItems: (res) => res.departments,
    updateStatusFn: (id, status) => departmentsService.update(id, { status }),
    removeFn: departmentsService.remove,
  });
}
