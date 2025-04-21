import { Suspense } from 'react';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>

      {/* Fallback UI while client-side tab logic initializes */}
      <Suspense fallback={<p>Loading settings…</p>}>
        <SettingsClient />
      </Suspense>
    </div>
  );
}
