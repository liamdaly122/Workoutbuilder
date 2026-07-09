export interface VolumeSet {
  weight: number | null;
  reps: number | null;
}

export function totalVolume(sets: VolumeSet[]): number {
  return sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
}
