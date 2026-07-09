import type { EquipmentItem } from '../domain/types';

interface Props {
  items: EquipmentItem[];
  onToggle: (item: EquipmentItem) => void;
}

export function EquipmentGrid({ items, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item)}
          disabled={item.id === 'bodyweight'}
          className={`rounded-xl border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${
            item.available
              ? 'border-sky-500 bg-sky-500/10 text-white'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
        >
          {item.label}
          {item.id === 'bodyweight' && <span className="ml-1 text-xs text-slate-500">(always on)</span>}
        </button>
      ))}
    </div>
  );
}
