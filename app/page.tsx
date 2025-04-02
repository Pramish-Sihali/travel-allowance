// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <svg 
              className="w-8 h-8" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M16 16V8H8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">Travel Allowance System</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Welcome to the Travel Allowance System</h2>
              <p className="text-gray-600 mb-8">
                Apply for travel allowances, submit receipts, and track your requests in one place.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/employee/dashboard"
                  className="block p-6 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition"
                >
                  <h3 className="text-xl font-bold mb-2">Employee Portal</h3>
                  <p>Submit new travel requests and track existing requests</p>
                </Link>
                
                <Link
                  href="/approver/dashboard"
                  className="block p-6 bg-green-500 text-white rounded-lg text-center hover:bg-green-600 transition"
                >
                  <h3 className="text-xl font-bold mb-2">Approver Portal</h3>
                  <p>Review and approve employee travel requests</p>
                </Link>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 border-t">
              <h3 className="font-semibold mb-2">Quick Policy Reminders:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>All travel must be approved by your immediate supervisor and Finance Head</li>
                <li>Submit receipts within 3 days of returning from travel</li>
                <li>Per-diem allowance is NPR 1,500 per day</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}