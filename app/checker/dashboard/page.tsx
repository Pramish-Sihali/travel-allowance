import { requireRole } from "@/lib/auth";
import Link from 'next/link';
import { UserCircle, LogOut } from 'lucide-react';

export default async function CheckerDashboardPage() {
  // Ensure the user is a checker
  const user = await requireRole(["checker"]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-md">
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
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <UserCircle className="w-5 h-5" />
              <span className="font-medium">Welcome, {user.name || "Checker"}</span>
            </div>
            <Link 
              href="/api/auth/signout" 
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-purple-800 hover:bg-purple-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Financial Checker Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Pending Financial Verification</h3>
              <p className="text-gray-600">Requests awaiting your financial verification will appear here.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Recently Verified</h3>
              <p className="text-gray-600">Your recently verified requests will appear here.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Financial Dashboard</h3>
              <p className="text-gray-600">Financial metrics and insights will appear here.</p>
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