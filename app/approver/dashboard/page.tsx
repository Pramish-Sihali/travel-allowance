'use client';

import ApproverDashboard from '@/components/dashboard/ApproverDashboard';
import Header from '@/components/layout/Header';

export default function ApproverDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="approver" />
      
      <main className="flex-grow p-6">
        <ApproverDashboard />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}