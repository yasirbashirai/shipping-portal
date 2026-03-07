import { Bell } from 'lucide-react';
import { useFilterStore } from '../store/filterStore.js';

const websiteOptions = [
  { value: 'ALL', label: 'Both Sites' },
  { value: 'CABINETS_DEALS', label: 'Cabinets.deals' },
  { value: 'NORTHVILLE_CABINETRY', label: 'Northville' },
];

/**
 * Top header bar with page title, website filter toggle, and notifications
 * @param {{ title: string }} props
 */
export default function Header({ title }) {
  const { sourceWebsite, setSourceWebsite } = useFilterStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6" data-testid="header">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Website filter */}
        <div className="flex bg-gray-100 rounded-md p-0.5" data-testid="website-filter">
          {websiteOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSourceWebsite(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                sourceWebsite === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`filter-${opt.value.toLowerCase()}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
