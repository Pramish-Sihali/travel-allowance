// app/approver/dashboard/page.tsx

'use client'; 

import ApproverDashboard from '@/components/dashboard/ApproverDashboard';
import Link from 'next/link';
import { UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export default function ApproverDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-green-700 to-green-500 text-white shadow-md">
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
              <span className="font-medium">Welcome, Approver</span>
            </div>
            <Button 
  onClick={() => signOut({ callbackUrl: '/' })}
  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-green-800 hover:bg-green-900 transition-colors"
>
  <LogOut className="w-4 h-4" />
  <span>Logout</span>
</Button>
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
