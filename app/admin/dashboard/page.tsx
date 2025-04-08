import { requireRole } from "@/lib/server/auth";
import Link from 'next/link';
import { UserCircle, LogOut, Users, FileText, DollarSign, Settings } from 'lucide-react';

export default async function AdminDashboardPage() {
  // Ensure the user is an admin
  const user = await requireRole(["admin"]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-md">
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
              <span className="font-medium">Welcome, {user.name || "Admin"}</span>
            </div>
            <Link 
              href="/api/auth/signout" 
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Requests</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-2xl font-bold">$24,500</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Settings className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">System Health</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <p className="text-gray-600">System activity will appear here.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">System Overview</h3>
              <p className="text-gray-600">System health and metrics will appear here.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Role Management</h3>
              <p className="text-gray-600">User role management options will appear here.</p>
              <Link 
                href="/admin/users" 
                className="text-blue-500 hover:underline block mt-4 text-sm"
              >
                Manage Users →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <p className="text-gray-600">System configuration options will appear here.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Reports</h3>
              <p className="text-gray-600">Generate and view system reports.</p>
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