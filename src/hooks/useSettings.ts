import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../data/repositories/settingsRepo';

export function useSettings() {
  const query = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  return query.data;
}
