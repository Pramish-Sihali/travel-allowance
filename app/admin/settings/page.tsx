// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Settings,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Briefcase,
  DollarSign,
  Building,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";

// Define types for our database entities
interface Project {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
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

export default function AdminSettings() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  
  // Project dialog state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    active: true
  });
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  
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
  const [deleteType, setDeleteType] = useState<'project' | 'budget'>('project');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects and budgets on component mount
  useEffect(() => {
    fetchProjects();
    fetchBudgets();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle project form submission (create/update)
  const handleProjectSubmit = async () => {
    setIsProjectSubmitting(true);
    
    try {
      const url = selectedProject 
        ? `/api/admin/projects/${selectedProject.id}` 
        : '/api/admin/projects';
      
      const method = selectedProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectFormData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save project');
      }
      
      // Refresh projects list
      await fetchProjects();
      
      // Close dialog and reset form
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
      setProjectFormData({
        name: '',
        description: '',
        active: true
      });
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project. Please try again.');
    } finally {
      setIsProjectSubmitting(false);
    }
  };
  
  // Handle budget form submission (create/update)
  const handleBudgetSubmit = async () => {
    setIsBudgetSubmitting(true);
    
    try {
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
        throw new Error('Failed to save budget');
      }
      
      // Refresh budgets list
      await fetchBudgets();
      
      // Close dialog and reset form
      setIsBudgetDialogOpen(false);
      setSelectedBudget(null);
      setBudgetFormData({
        project_id: '',
        amount: 0,
        fiscal_year: new Date().getFullYear(),
        description: ''
      });
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error saving budget. Please try again.');
    } finally {
      setIsBudgetSubmitting(false);
    }
  };
  
  // Handle delete project/budget
  const handleDelete = async () => {
    if (!deleteItemId) return;
    
    setIsDeleting(true);
    
    try {
      const url = deleteType === 'project' 
        ? `/api/admin/projects/${deleteItemId}` 
        : `/api/admin/budgets/${deleteItemId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${deleteType}`);
      }
      
      // Refresh data
      if (deleteType === 'project') {
        await fetchProjects();
        await fetchBudgets(); // In case budgets are deleted in cascade
      } else {
        await fetchBudgets();
      }
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      alert(`Error deleting ${deleteType}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit project handler
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description,
      active: project.active
    });
    setIsProjectDialogOpen(true);
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
  
  // New project handler
  const handleNewProject = () => {
    setSelectedProject(null);
    setProjectFormData({
      name: '',
      description: '',
      active: true
    });
    setIsProjectDialogOpen(true);
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

  // Filter projects
  const filteredProjects = projects.filter(project => {
    // Apply search filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply active filter
    const matchesActive = filterActive === null || project.active === filterActive;
    
    return matchesSearch && matchesActive;
  });

  // Get a project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Filter budgets
  const filteredBudgets = budgets.filter(budget => {
    return budget.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectName(budget.project_id).toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Render skeleton loader for projects table
  const renderProjectsSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
              <TableHead><Skeleton className="h-4 w-[250px]" /></TableHead>
              <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
              <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // Render skeleton loader for budgets table
  const renderBudgetsSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="admin" />
      
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              System Settings
            </h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Manage projects, budgets, and other system settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab}>
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search projects..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 max-w-md"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="filter-active" className="whitespace-nowrap">Show Active Only</Label>
                        <Switch
                          id="filter-active"
                          checked={filterActive === true}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterActive(true);
                            } else if (filterActive === true) {
                              setFilterActive(null); // Toggle to show all
                            } else {
                              setFilterActive(false); // Toggle to show inactive
                            }
                          }}
                        />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterActive(null);
                        }}
                        className="h-10 w-10"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button onClick={handleNewProject} className="flex gap-2 items-center">
                      <PlusCircle className="h-4 w-4" />
                      Add Project
                    </Button>
                  </div>
                  
                  {loading ? (
                    renderProjectsSkeleton()
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">No projects found</p>
                      <p className="text-sm text-muted-foreground mb-6">Add a new project or adjust your search criteria</p>
                      <Button onClick={handleNewProject} className="flex gap-2 items-center">
                        <PlusCircle className="h-4 w-4" />
                        Add Project
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProjects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>{project.description}</TableCell>
                              <TableCell>
                                {project.active ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditProject(project)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setDeleteType('project');
                                      setDeleteItemId(project.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
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
                  )}
                </TabsContent>
                
                {/* Budgets Tab */}
                <TabsContent value="budgets" className="p-6 space-y-6">
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
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setSearchTerm('')}
                        className="h-10 w-10"
                      >
                        <RefreshCw className="h-4 w-4" />
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
                  
                  {loading ? (
                    renderBudgetsSkeleton()
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">No projects available</p>
                      <p className="text-sm text-muted-foreground mb-6">You need to create projects before adding budgets</p>
                      <Button onClick={() => setActiveTab('projects')} className="flex gap-2 items-center">
                        <Briefcase className="h-4 w-4" />
                        Go to Projects
                      </Button>
                    </div>
                  ) : filteredBudgets.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">No budgets found</p>
                      <p className="text-sm text-muted-foreground mb-6">Add a new budget or adjust your search criteria</p>
                      <Button onClick={handleNewBudget} className="flex gap-2 items-center">
                        <PlusCircle className="h-4 w-4" />
                        Add Budget
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Fiscal Year</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBudgets.map((budget) => (
                            <TableRow key={budget.id}>
                              <TableCell className="font-medium">
                                {getProjectName(budget.project_id)}
                              </TableCell>
                              <TableCell className="font-mono">
                                Nrs.{budget.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </TableCell>
                              <TableCell>{budget.fiscal_year}</TableCell>
                              <TableCell>{budget.description}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditBudget(budget)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setDeleteType('budget');
                                      setDeleteItemId(budget.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
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
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? 'Edit Project' : 'Add New Project'}
            </DialogTitle>
            <DialogDescription>
              {selectedProject 
                ? 'Update project details below.' 
                : 'Fill in the project details to create a new project.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Name
              </Label>
              <Input
                id="project-name"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="project-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="project-description"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter project description"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  checked={projectFormData.active}
                  onCheckedChange={(checked) => setProjectFormData({...projectFormData, active: checked})}
                />
                <span>{projectFormData.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProjectDialogOpen(false);
                setSelectedProject(null);
                setProjectFormData({name: '', description: '', active: true});
              }}
              disabled={isProjectSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleProjectSubmit}
              disabled={isProjectSubmitting || !projectFormData.name.trim()}
            >
              {isProjectSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedProject ? 'Updating...' : 'Creating...'}
                </>
              ) : selectedProject ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
                <select
                  id="budget-project"
                  value={budgetFormData.project_id}
                  onChange={(e) => setBudgetFormData({...budgetFormData, project_id: e.target.value})}
                  className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
                  required
                >
                  {projects
                    .filter(project => project.active || selectedBudget?.project_id === project.id)
                    .map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))
                  }
                </select>
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
                onChange={(e) => setBudgetFormData({...budgetFormData, fiscal_year: parseInt(e.target.value) || new Date().getFullYear()})}
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
              Delete {deleteType.charAt(0).toUpperCase() + deleteType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {deleteType === 'project'
                ? 'Are you sure you want to delete this project? This action cannot be undone and will also delete all associated budgets.'
                : 'Are you sure you want to delete this budget? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-900 text-sm">
              <p className="font-medium mb-1">Warning:</p>
              <p className="text-red-700">
                {deleteType === 'project'
                  ? 'This will permanently delete the project and all its associated data.'
                  : 'This will permanently delete the budget allocation.'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteItemId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
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
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}