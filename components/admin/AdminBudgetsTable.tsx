'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { 
  Search, 
  RefreshCw,
  PlusCircle,
  Edit,
  Trash2,
  DollarSign,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Calendar,
  FilterX
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface Budget {
  id: string;
  project_id: string;
  amount: number;
  fiscal_year: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function AdminBudgetsTable() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Budget dialog state
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetFormData, setBudgetFormData] = useState({
    project_id: '',
    amount: 0,
    fiscal_year: new Date().getFullYear(),
    description: ''
  });
  const [isBudgetSubmitting, setIsBudgetSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Fetch budgets and projects on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (budgets.length > 0) {
      const years = budgets.map(b => b.fiscal_year)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => b - a); // Sort in descending order (newest first)
      
      setAvailableYears(years);
    }
  }, [budgets]);

  const fetchExistingBudget = async (projectId: string, fiscalYear: number) => {
    try {
      const response = await fetch(`/api/admin/budgets?project_id=${projectId}&fiscal_year=${fiscalYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch existing budgets');
      }
      
      const data = await response.json();
      
      // If we have matching budgets for this project and fiscal year
      if (data && data.length > 0) {
        const existingBudget = data[0]; // Take the first one if multiple exist
        
        // Update the form with existing budget data
        setBudgetFormData({
          project_id: existingBudget.project_id,
          amount: existingBudget.amount,
          fiscal_year: existingBudget.fiscal_year,
          description: existingBudget.description
        });
        
        // Set the selected budget for editing
        setSelectedBudget(existingBudget);
        
       
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error fetching existing budget:', error);
     
      return false;
    }
  };

  const handleProjectChange = async (projectId: string) => {
    // First update the project_id in the form
    setBudgetFormData({
      ...budgetFormData,
      project_id: projectId
    });
    
    // Then check if there's an existing budget for this project in the current fiscal year
    await fetchExistingBudget(projectId, budgetFormData.fiscal_year);
  };
  
  // Also handle fiscal year changes
  const handleFiscalYearChange = async (year: number) => {
    setBudgetFormData({
      ...budgetFormData,
      fiscal_year: year
    });
    
    // Check for existing budget if we have a project selected
    if (budgetFormData.project_id) {
      await fetchExistingBudget(budgetFormData.project_id, year);
    }
  };


  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch budgets
      const budgetsResponse = await fetch('/api/admin/budgets');
      if (!budgetsResponse.ok) {
        throw new Error(`Failed to fetch budgets: ${budgetsResponse.statusText}`);
      }
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData);
      
      // Fetch projects for dropdown
      const projectsResponse = await fetch('/api/admin/projects');
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      
    } finally {
      setLoading(false);
    }
  };
  
  // Request sort by column
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sorted and filtered budgets
  const getFilteredBudgets = () => {
    let filteredBudgets = [...budgets];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredBudgets = filteredBudgets.filter(budget => {
        const project = projects.find(p => p.id === budget.project_id);
        const projectName = project ? project.name.toLowerCase() : '';
        
        return (
          projectName.includes(lowerCaseSearch) ||
          budget.description.toLowerCase().includes(lowerCaseSearch) ||
          budget.fiscal_year.toString().includes(lowerCaseSearch)
        );
      });
    }
    
    // Apply project filter
    if (projectFilter !== 'all') {
      filteredBudgets = filteredBudgets.filter(budget => budget.project_id === projectFilter);
    }
    
    // Apply year filter
    if (yearFilter !== 'all') {
      filteredBudgets = filteredBudgets.filter(budget => budget.fiscal_year.toString() === yearFilter);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredBudgets.sort((a, b) => {
        // Handle special case for project_id (sort by project name)
        if (sortConfig.key === 'project_id') {
          const projectA = projects.find(p => p.id === a.project_id);
          const projectB = projects.find(p => p.id === b.project_id);
          const nameA = projectA ? projectA.name.toLowerCase() : '';
          const nameB = projectB ? projectB.name.toLowerCase() : '';
          
          if (nameA < nameB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (nameA > nameB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
        
        // @ts-ignore - Dynamic access to object properties
        const aValue = a[sortConfig.key];
        // @ts-ignore - Dynamic access to object properties
        const bValue = b[sortConfig.key];
        
        // Handle number comparisons
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending'
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // Handle date comparisons
        if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
          const aDate = new Date(aValue).getTime();
          const bDate = new Date(bValue).getTime();
          
          if (aDate < bDate) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
        
        // Handle string comparisons
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredBudgets;
  };
  
  // Get paginated budgets
  const getPaginatedBudgets = () => {
    const filteredBudgets = getFilteredBudgets();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBudgets.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(getFilteredBudgets().length / itemsPerPage);
  
  // Get sort indicator for table headers
  const getSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown size={14} className="ml-1 text-primary rotate-0" />;
    }
    
    return <ArrowUpDown size={14} className="ml-1 text-primary rotate-180" />;
  };
  
  // Get a project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Handle budget form submission (create/update)
  const handleBudgetSubmit = async () => {
    try {
      setIsBudgetSubmitting(true);
      
      // Validate form
      if (!budgetFormData.project_id) {
       
        return;
      }
      
      const url = selectedBudget 
        ? `/api/admin/budgets/${selectedBudget.id}` 
        : '/api/admin/budgets';
      
      const method = selectedBudget ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetFormData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${selectedBudget ? 'update' : 'create'} budget`);
      }
      
      // Refresh budgets list
      await fetchData();
      
      // Close dialog and reset form
      setIsBudgetDialogOpen(false);
      setSelectedBudget(null);
      setBudgetFormData({
        project_id: projects.length > 0 ? projects[0].id : '',
        amount: 0,
        fiscal_year: new Date().getFullYear(),
        description: ''
      });
      
     
    } catch (error) {
      console.error('Error saving budget:', error);
     
    } finally {
      setIsBudgetSubmitting(false);
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/budgets/${selectedBudget.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget');
      }
      
      // Refresh data
      await fetchData();
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedBudget(null);
      
     
    } catch (error) {
      console.error('Error deleting budget:', error);
     
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit budget handler
  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setBudgetFormData({
      project_id: budget.project_id,
      amount: budget.amount,
      fiscal_year: budget.fiscal_year,
      description: budget.description
    });
    setIsBudgetDialogOpen(true);
  };
  
  // New budget handler
  const handleNewBudget = () => {
    setSelectedBudget(null);
    setBudgetFormData({
      project_id: projects.length > 0 ? projects[0].id : '',
      amount: 0,
      fiscal_year: new Date().getFullYear(),
      description: ''
    });
    setIsBudgetDialogOpen(true);
  };
  
  // Function to handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Handle displaying page numbers for pagination with many pages
            let pageNum;
            if (totalPages <= 5) {
              // Show all page numbers if 5 or fewer
              pageNum = i + 1;
            } else {
              // Show a window of pages around current page
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="mx-1">...</span>}
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };
  
  // Render budget summary cards at top
  const renderBudgetSummary = () => {
    // Calculate total budget across all fiscal years
    const totalBudget = budgets.reduce((total, budget) => total + budget.amount, 0);
    
    // Calculate current fiscal year's budget
    const currentYear = new Date().getFullYear();
    const currentYearBudget = budgets
      .filter(budget => budget.fiscal_year === currentYear)
      .reduce((total, budget) => total + budget.amount, 0);
    
    // Calculate previous fiscal year's budget
    const previousYearBudget = budgets
      .filter(budget => budget.fiscal_year === currentYear - 1)
      .reduce((total, budget) => total + budget.amount, 0);
    
    // Calculate budget by project (top 3)
    const projectBudgets = budgets.reduce((acc: Record<string, number>, budget) => {
      const projectId = budget.project_id;
      if (!acc[projectId]) acc[projectId] = 0;
      acc[projectId] += budget.amount;
      return acc;
    }, {});
    
    // Convert to array, sort by amount, and take top 3
    const topProjects = Object.entries(projectBudgets)
      .map(([projectId, amount]) => ({
        projectId,
        amount,
        projectName: getProjectName(projectId)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">Nrs.{totalBudget.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Across all fiscal years
              </p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current FY Budget</p>
              <p className="text-2xl font-bold">Nrs.{currentYearBudget.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Fiscal Year {currentYear}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Previous FY Budget</p>
              <p className="text-2xl font-bold">Nrs.{previousYearBudget.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Fiscal Year {currentYear - 1}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Top Projects</p>
            {topProjects.length > 0 ? (
              <div className="space-y-2">
                {topProjects.map((project, index) => (
                  <div key={project.projectId} className="flex justify-between items-center">
                    <p className="text-xs truncate max-w-[150px]">{project.projectName}</p>
                    <p className="text-xs font-medium">Nrs.{project.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No project budgets defined</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[200px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Budget Management</h3>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        
        <div className="p-6 border rounded-lg bg-red-50 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800 mb-1">Error Loading Budgets</h4>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const filteredBudgets = getFilteredBudgets();
  const paginatedBudgets = getPaginatedBudgets();
  const totalAmount = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {renderBudgetSummary()}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
          
          <Select
            value={projectFilter}
            onValueChange={(value) => setProjectFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.filter(p => p.active).map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={yearFilter}
            onValueChange={(value) => setYearFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by fiscal year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fiscal Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              setSearchTerm('');
              setProjectFilter('all');
              setYearFilter('all');
              setCurrentPage(1);
            }}
            className="h-10 w-10"
            title="Clear filters"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={handleNewBudget} 
          className="flex gap-2 items-center"
          disabled={projects.length === 0}
        >
          <PlusCircle className="h-4 w-4" />
          Add Budget
        </Button>
      </div>
      
      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No budgets found</p>
          <p className="text-sm text-muted-foreground mb-6">Add a new budget or adjust your search criteria</p>
          {projects.length === 0 ? (
            <div className="max-w-sm mx-auto">
              <p className="text-sm text-amber-600 mb-4">You need to create projects before adding budgets</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/settings?tab=projects'}
                className="flex gap-2 items-center"
              >
                <PlusCircle className="h-4 w-4" />
                Create Projects First
              </Button>
            </div>
          ) : (
            <Button onClick={handleNewBudget} className="flex gap-2 items-center">
              <PlusCircle className="h-4 w-4" />
              Add Budget
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort('project_id')}
                  >
                    <div className="flex items-center">
                      Project {getSortIndicator('project_id')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort('amount')}
                  >
                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-1 text-muted-foreground" />
                      Amount {getSortIndicator('amount')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort('fiscal_year')}
                  >
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1 text-muted-foreground" />
                      Fiscal Year {getSortIndicator('fiscal_year')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort('description')}
                  >
                    <div className="flex items-center">
                      Description {getSortIndicator('description')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {getProjectName(budget.project_id)}
                    </TableCell>
                    <TableCell className="font-mono">
                      Nrs.{budget.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                    <TableCell>{budget.fiscal_year}</TableCell>
                    <TableCell className="max-w-xs truncate">{budget.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBudget(budget)}
                          title="Edit budget"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedBudget(budget);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete budget"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}
      
      <div className="text-sm text-muted-foreground flex justify-between items-center mt-4">
        <div>Total budgets: {budgets.length}</div>
        <div>
          Current selection: Nrs.{totalAmount.toLocaleString()} 
          ({filteredBudgets.length} budgets)
        </div>
      </div>
      
      {/* Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBudget ? 'Edit Budget' : 'Add New Budget'}
            </DialogTitle>
            <DialogDescription>
              {selectedBudget 
                ? 'Update budget details below.' 
                : 'Fill in the budget details to create a new budget allocation.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget-project" className="text-right">
                Project
              </Label>
              <div className="col-span-3">

              <Select
  value={budgetFormData.project_id}
  onValueChange={handleProjectChange}
>
  <SelectTrigger id="budget-project">
    <SelectValue placeholder="Select project" />
  </SelectTrigger>
  <SelectContent>
    {projects
      .filter(project => project.active || (selectedBudget?.project_id === project.id))
      .map(project => (
        <SelectItem key={project.id} value={project.id}>
          {project.name}
        </SelectItem>
      ))
    }
  </SelectContent>
</Select>


              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget-amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="px-3 py-2 bg-muted/50 border-y border-l rounded-l-md text-muted-foreground">Nrs.</span>
                <Input
                  id="budget-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetFormData.amount}
                  onChange={(e) => setBudgetFormData({...budgetFormData, amount: parseFloat(e.target.value) || 0})}
                  className="rounded-l-none"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget-fiscal-year" className="text-right">
                Fiscal Year
              </Label>
              <Input
  id="budget-fiscal-year"
  type="number"
  min={new Date().getFullYear() - 5}
  max={new Date().getFullYear() + 5}
  value={budgetFormData.fiscal_year}
  onChange={(e) => handleFiscalYearChange(parseInt(e.target.value) || new Date().getFullYear())}
  className="col-span-3"
  required
/>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="budget-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="budget-description"
                value={budgetFormData.description}
                onChange={(e) => setBudgetFormData({...budgetFormData, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter budget description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBudgetDialogOpen(false);
                setSelectedBudget(null);
                setBudgetFormData({
                  project_id: projects.length > 0 ? projects[0].id : '',
                  amount: 0,
                  fiscal_year: new Date().getFullYear(),
                  description: ''
                });
              }}
              disabled={isBudgetSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleBudgetSubmit}
              disabled={isBudgetSubmitting || !budgetFormData.project_id}
            >
              {isBudgetSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedBudget ? 'Updating...' : 'Creating...'}
                </>
              ) : selectedBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Delete Budget
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-900 text-sm">
              <p className="font-medium mb-1">Warning:</p>
              <p className="text-red-700">
                This will permanently delete the budget allocation.
              </p>
              
              {selectedBudget && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p><span className="font-medium">Project:</span> {getProjectName(selectedBudget.project_id)}</p>
                  <p><span className="font-medium">Amount:</span> Nrs.{selectedBudget.amount.toLocaleString()}</p>
                  <p><span className="font-medium">Fiscal Year:</span> {selectedBudget.fiscal_year}</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedBudget(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteBudget}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}