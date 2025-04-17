'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from 'uuid';
import NotificationsPanel from './NotificationsPanel';
import { 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Mail, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CreditCard,
  MapPin,
  Plane
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  
  // Get employeeId from session, or generate one if not available
  const employeeId = session?.user?.id || uuidv4();
  
  useEffect(() => {
    const fetchRequests = async () => {
      if (status === 'loading') return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/requests?employeeId=${employeeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        const data = await response.json();
        console.log('Fetched employee requests:', data);
        setRequests(data);
        
        // Calculate statistics
        const pendingCount = data.filter((req: TravelRequest) => req.status === 'pending').length;
        const approvedCount = data.filter((req: TravelRequest) => req.status === 'approved').length;
        const rejectedCount = data.filter((req: TravelRequest) => req.status === 'rejected').length;
        const totalAmount = data.reduce((sum: number, req: TravelRequest) => sum + req.totalAmount, 0);
        
        setStats({
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          totalAmount: totalAmount
        });
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [employeeId, status]);
  
  const handleNewRequest = () => {
    router.push('/employee/requests/new');
  };
  
  // Get CSS classes for status badges instead of using variants
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Policy items with standard quotes
  const policyItems = [
    'Employees must submit all invoices and supporting documents within three days of returning from the field.',
    'The maximum lodging allowance for each official trip will be determined by the Board and the Finance Department based on the nature of the travel.',
    'Local travel and food allowances will be covered through per-diem (NPR 1,500), and no invoices are needed for these expenses.',
    'Accommodation and other costs will be reimbursed based on actual expenses, with invoices in the company\'s name required.',
    'Any additional expenses for which reimbursement is requested must be supported by invoices or bills.'
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">My Travel Requests</h1>
            

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button className="flex items-center gap-2">
      <PlusCircle size={16} />
      New Request
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => router.push('/employee/requests/new')}>
      <Plane className="h-4 w-4 mr-2" />
      Travel Request
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push('/employee/requests/in-valley')}>
      <MapPin className="h-4 w-4 mr-2" />
      In-Valley Reimbursement
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-amber-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-amber-100">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Pending</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-100">
                    <FileText size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Approved</p>
                    <p className="text-xl font-bold">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Rejected</p>
                    <p className="text-xl font-bold">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <DollarSign size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
                    <p className="text-xl font-bold">
                      Nrs.{stats.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">You haven't submitted any travel requests yet.</p>
                </div>
                <Button
                  onClick={handleNewRequest}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <PlusCircle size={16} />
                  Create Your First Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Requests</CardTitle>
                <CardDescription>
                  View and manage your submitted travel requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-muted-foreground" />
                          Purpose
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-muted-foreground" />
                          Dates
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-muted-foreground" />
                          Type
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <DollarSign size={16} className="mr-2 text-muted-foreground" />
                          Amount
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-muted-foreground" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead>Submitted On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow 
                        key={request.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/employee/requests/${request.id}`)}
                      >
                        <TableCell>
                          <div className="max-w-[200px] truncate font-medium" title={request.purpose}>
                            {request.purpose.substring(0, 30)}
                            {request.purpose.length > 30 ? '...' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">
                              {new Date(request.travelDateFrom).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-muted-foreground">
                              to {new Date(request.travelDateTo).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "flex items-center gap-1.5 w-fit",
                            request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          )}>
                            {(request.requestType === 'normal' || !request.requestType) && <FileText className="h-3 w-3" />}
                            {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                            {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                            {(request.requestType || 'normal').charAt(0).toUpperCase() + (request.requestType || 'normal').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(request.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-end text-sm text-muted-foreground">
                {/* <Button variant="ghost" className="flex items-center gap-1" onClick={() => router.push('/employee/requests')}>
                  View all requests
                  <ChevronRight size={16} />
                </Button> */}
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen size={18} className="text-primary" />
                Policy Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {policyItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <NotificationsPanel userId={employeeId} />
          
          <Card>
            <CardHeader className=" text-black">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink size={18} />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                >
                  <BookOpen size={18} className="text-primary" />
                  <span>Travel Policy Documents</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                >
                  <FileText size={18} className="text-primary" />
                  <span>Expense Categories Guide</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                >
                  <Mail size={18} className="text-primary" />
                  <span>Contact Finance Department</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                >
                  <HelpCircle size={18} className="text-primary" />
                  <span>Frequently Asked Questions</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-3">
                If you have any questions about your travel reimbursements or need assistance with your requests, contact the finance team.
              </p>
              <Button variant="link" asChild className="p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <a href="mailto:finance@company.com">
                  <Mail size={14} />
                  finance@company.com
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}