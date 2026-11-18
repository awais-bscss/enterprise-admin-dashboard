import { queryKeys } from '../lib/queryKeys';
import { clientsService } from '../services/apiService';
import { useEntityDirectory } from './useEntityDirectory';

export function useClientsWorkspace() {
  return useEntityDirectory({
    scope: 'clients',
    noun: 'client',
    getQueryKey: queryKeys.clients.list,
    listFn: clientsService.list,
    extractItems: (res) => res.clients,
    updateStatusFn: (id, status) => clientsService.update(id, { status }),
    removeFn: clientsService.remove,
  });
}
