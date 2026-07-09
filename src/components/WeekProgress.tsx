interface Props {
  weekNumber: number;
  isDeload?: boolean;
}

export function WeekProgress({ weekNumber, isDeload }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((w) => (
          <div
            key={w}
            className={`h-1.5 flex-1 rounded-full ${
              w < weekNumber
                ? 'bg-sky-600'
                : w === weekNumber
                  ? 'bg-sky-400'
                  : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <span className="text-xs whitespace-nowrap text-slate-400">
        Week {weekNumber}/5{isDeload ? ' · Deload' : ''}
      </span>
    </div>
  );
}
