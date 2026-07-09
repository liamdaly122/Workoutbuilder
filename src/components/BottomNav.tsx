import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Today', icon: '🏠', end: true },
  { to: '/catalog', label: 'Catalog', icon: '📖', end: false },
  { to: '/progress', label: 'Progress', icon: '📈', end: false },
  { to: '/history', label: 'History', icon: '🗓️', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive ? 'text-sky-400' : 'text-slate-500'
                }`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
