import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, get } from '../services/api';
export const useData = <T,>(path: string) => useQuery({
  queryKey: [path],
  queryFn: () => get<T>(path)
});
export function useSave(path: string, method: 'post' | 'put' | 'patch' | 'delete' = 'post', onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.request({
      url: path,
      method,
      data: body
    }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries();
      onSuccess?.();
    }
  });
}
export function useDebounce<T>(value: T, delay = 300) {
  const [d, set] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => set(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}
