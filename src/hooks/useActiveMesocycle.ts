import { useQuery } from '@tanstack/react-query';
import { getActiveMesocycle } from '../data/repositories/mesocycleRepo';

export function useActiveMesocycle() {
  const query = useQuery({ queryKey: ['mesocycle', 'active'], queryFn: getActiveMesocycle });
  return query.data;
}
