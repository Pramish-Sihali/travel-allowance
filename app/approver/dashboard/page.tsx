'use client';

import { Suspense } from 'react';
import LandingPage from '@/components/dashboard/LandingPage';
import Header from '@/components/layout/Header';

export default function ApproverDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    }>
      <LandingPage userRole="approver" />
    </Suspense>
  );
}