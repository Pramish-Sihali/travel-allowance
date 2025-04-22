'use client';

import { Suspense } from 'react';

import Header from '@/components/layout/Header';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

export default function EmployeeDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="employee" />
      
      <main className="flex-grow p-6">
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <EmployeeDashboard />
        </Suspense>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}