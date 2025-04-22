'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Settings,
  Briefcase,
  DollarSign,
  ArrowLeft,
  Building,
  HomeIcon
} from 'lucide-react';

import AdminProjectsTable from '@/components/admin/AdminProjectsTable';
import AdminBudgetsTable from '@/components/admin/AdminBudgetsTable';

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('projects');
  
  // Set the active tab based on URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'projects' || tabParam === 'budgets')) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  };
  
  const navigateToDashboard = () => {
    router.push('/admin/dashboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
     
      
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={navigateToDashboard}
                className="flex items-center gap-2 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only md:not-sr-only">Back to Dashboard</span>
              </Button>
              
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                System Settings
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={navigateToDashboard}
                className="hidden md:flex items-center gap-2"
              >
                <HomeIcon className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Projects</CardTitle>
                  <CardDescription>Manage projects and their details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTabChange('projects')}
                  className="shrink-0"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Budgets</CardTitle>
                  <CardDescription>Manage budget allocations</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTabChange('budgets')}
                  className="shrink-0"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Manage projects, budgets, and other system settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="projects" value={activeTab} onValueChange={handleTabChange}>
                <div className="px-6 border-b">
                  <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
                    <TabsTrigger value="projects" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Projects</span>
                    </TabsTrigger>
                    <TabsTrigger value="budgets" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Budgets</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Projects Tab */}
                <TabsContent value="projects" className="p-6 space-y-6">
                  <AdminProjectsTable />
                </TabsContent>
                
                {/* Budgets Tab */}
                <TabsContent value="budgets" className="p-6 space-y-6">
                  <AdminBudgetsTable />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      
    </div>
  );
}