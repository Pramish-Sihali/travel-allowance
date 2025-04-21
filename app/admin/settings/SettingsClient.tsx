// app/admin/settings/SettingsClient.tsx
'use client';

import { useSearchParams } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AdminProjectsTable from '@/components/admin/AdminProjectsTable';
import AdminBudgetsTable from '@/components/admin/AdminBudgetsTable';

export default function SettingsClient() {
  const searchParams = useSearchParams();               // Client hook
  const tab = searchParams.get('tab') ?? 'budgets';     // e.g. ?tab=projects

  return (
    <Tabs value={tab}>
      <TabsList>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="budgets">Budgets</TabsTrigger>
      </TabsList>

      <TabsContent value="projects">
        <AdminProjectsTable />
      </TabsContent>
      <TabsContent value="budgets">
        <AdminBudgetsTable />
      </TabsContent>
    </Tabs>
  );
}
