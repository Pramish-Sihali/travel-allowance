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
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { 
  Search, 
  RefreshCw,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Briefcase,
  ArrowUpDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProjectsTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Project dialog state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    active: true
  });
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/projects');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
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
  
  // Get sorted and filtered projects
  const getFilteredProjects = () => {
    let filteredProjects = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(lowerCaseSearch) ||
        project.description.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply active filter
    if (filterActive !== null) {
      filteredProjects = filteredProjects.filter(project => project.active === filterActive);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredProjects.sort((a, b) => {
        // @ts-ignore - Dynamic access to object properties
        const aValue = a[sortConfig.key] || '';
        // @ts-ignore - Dynamic access to object properties
        const bValue = b[sortConfig.key] || '';
        
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
        
        // Handle boolean comparisons
        if (typeof aValue === 'boolean') {
          if (aValue === bValue) return 0;
          return sortConfig.direction === 'ascending'
            ? (aValue ? 1 : -1)
            : (aValue ? -1 : 1);
        }
        
        // Handle string comparisons
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredProjects;
  };
  
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
  
  // Handle project form submission (create/update)
  const handleProjectSubmit = async () => {
    try {
      setIsProjectSubmitting(true);
      
      // Validate form
      if (!projectFormData.name.trim()) {
       
        return;
      }
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${selectedProject ? 'update' : 'create'} project`);
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
     
    } finally {
      setIsProjectSubmitting(false);
    }
  };
  
  // Handle deleting a project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // Refresh data
      await fetchProjects();
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      
      
    } catch (error) {
      console.error('Error deleting project:', error);
      
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

  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
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
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Project Management</h3>
          <Button onClick={fetchProjects} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        
        <div className="p-6 border rounded-lg bg-red-50 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800 mb-1">Error Loading Projects</h4>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const filteredProjects = getFilteredProjects();

  return (
    <div className="space-y-6">
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
      
      {filteredProjects.length === 0 ? (
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
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Project Name {getSortIndicator('name')}
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
                <TableHead
                  className="cursor-pointer w-32"
                  onClick={() => requestSort('active')}
                >
                  <div className="flex items-center">
                    Status {getSortIndicator('active')}
                  </div>
                </TableHead>
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
                        title="Edit project"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDeleteDialogOpen(true);
                        }}
                        title="Delete project"
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
      
      <div className="text-sm text-muted-foreground flex justify-between items-center mt-4">
        <div>Total projects: {projects.length}</div>
        <div>Showing {filteredProjects.length} of {projects.length} projects</div>
      </div>
      
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and will also delete all associated budgets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-900 text-sm">
              <p className="font-medium mb-1">Warning:</p>
              <p className="text-red-700">
                This will permanently delete the project and all its associated data.
              </p>
              
              {selectedProject && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="font-medium">{selectedProject.name}</p>
                  <p className="text-sm text-red-600 mt-1">{selectedProject.description}</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedProject(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
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