import Header from '../../components/Header.jsx';
import { Settings as SettingsIcon } from 'lucide-react';

/**
 * Admin settings page — placeholder for future configuration
 */
export default function Settings() {
  return (
    <div>
      <Header title="Settings" />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center" data-testid="settings-page">
          <SettingsIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-2">Configuration options coming soon.</p>
        </div>
      </div>
    </div>
  );
}
