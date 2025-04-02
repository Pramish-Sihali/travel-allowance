// app/approver/dashboard/page.tsx

import ApproverDashboard from '@/components/dashboard/ApproverDashboard';

export default function ApproverDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-green-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Travel Allowance System</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, Approver</span>
            <a href="/" className="text-sm underline">Logout</a>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-50 p-6">
        <ApproverDashboard />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}