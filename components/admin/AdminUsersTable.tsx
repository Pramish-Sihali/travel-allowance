'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  UserX, 
  RefreshCw,
  Filter,
  ArrowUpDown,
  Check,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Building,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '@/types';
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // User management state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    department: '',
    designation: ''
  });

  // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Extract available departments from users
  useEffect(() => {
    if (users.length > 0) {
      const departments = users
        .map(user => user.department)
        .filter((dept, index, self) => 
          dept && // Filter out null/undefined
          self.indexOf(dept) === index // Only unique values
        );
      
      setAvailableDepartments(departments);
    }
  }, [users]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
  
  // Get sorted and filtered users
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerCaseSearch)) ||
        (user.department && user.department.toLowerCase().includes(lowerCaseSearch)) ||
        (user.designation && user.designation.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.department === departmentFilter);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredUsers.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredUsers;
  };

  // Get paginated users
  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredUsers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredUsers().length / itemsPerPage);
  
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
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get role badge style
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'approver':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checker':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'employee':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Users className="h-3 w-3 mr-1" />;
      case 'approver':
        return <Check className="h-3 w-3 mr-1" />;
      case 'checker':
        return <Briefcase className="h-3 w-3 mr-1" />;
      case 'employee':
      default:
        return <UserPlus className="h-3 w-3 mr-1" />;
    }
  };
  
  // Function to handle adding a new user
  const handleAddUser = async () => {
    try {
      setIsProcessing(true);
      
      if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
       
        return;
      }
  
      // Create payload with correct field name mapping
      const userPayload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation  // Make sure we're using 'designation' not 'position'
      };
  
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const newUserData = await response.json();
      setUsers([...users, newUserData]);
      setIsAddDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        designation: ''  // Ensure we're consistent with field naming
      });
  
      
    } catch (error) {
      console.error('Error creating user:', error);
      
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to handle editing a user
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      
      if (!selectedUser.name || !selectedUser.email || !selectedUser.role) {
        
        return;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const updatedUser = await response.json();
      
      // Update the user in the array
      const updatedUsers = users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setIsEditDialogOpen(false);
      setSelectedUser(null);

     
    } catch (error) {
      console.error('Error updating user:', error);
     
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to handle deleting a user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Remove the user from the array
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);

      
    } catch (error) {
      console.error('Error deleting user:', error);
     
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to view user details
  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
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
  
  // Summary statistics at the top 
  const renderUserStats = () => {
    const adminCount = users.filter(user => user.role === 'admin').length;
    const approverCount = users.filter(user => user.role === 'approver').length;
    const checkerCount = users.filter(user => user.role === 'checker').length;
    const employeeCount = users.filter(user => user.role === 'employee').length;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-2xl font-bold">{employeeCount}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approvers</p>
              <p className="text-2xl font-bold">{approverCount}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Checkers</p>
              <p className="text-2xl font-bold">{checkerCount}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <UserPlus className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
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
                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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
          <h3 className="text-lg font-medium">User Management</h3>
          <Button onClick={fetchUsers} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-800">Error Loading Users</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Please check your network connection and try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const filteredUsers = getFilteredUsers();
  const paginatedUsers = getPaginatedUsers();
  
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {renderUserStats()}
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
          
          <Select
            value={roleFilter}
            onValueChange={value => setRoleFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="employee">Employees</SelectItem>
              <SelectItem value="approver">Approvers</SelectItem>
              <SelectItem value="checker">Checkers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>

          {availableDepartments.length > 0 && (
            <Select
              value={departmentFilter}
              onValueChange={value => setDepartmentFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setDepartmentFilter('all');
              setSortConfig(null);
              setCurrentPage(1);
            }} 
            size="icon"
            className="h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2 items-center">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account in the system.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Additional Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="col-span-3"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                  >
                    <SelectTrigger id="role" className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="approver">Approver</SelectItem>
                      <SelectItem value="checker">Checker</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">Department</Label>
                  <Input
                    id="department"
                    className="col-span-3"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="designation" className="text-right">Designation</Label>
                  <Input
                    id="designation"
                    className="col-span-3"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleAddUser}
                disabled={isProcessing || !newUser.name || !newUser.email || !newUser.password}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No users found</p>
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setDepartmentFilter('all');
            }} 
            variant="outline"
            className="mr-2"
          >
            Clear Filters
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Name {getSortIndicator('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email {getSortIndicator('email')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('role')}
                  >
                    <div className="flex items-center">
                      Role {getSortIndicator('role')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('department')}
                  >
                    <div className="flex items-center">
                      Department {getSortIndicator('department')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="cursor-pointer" onClick={() => handleViewUser(user)}>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{user.name || 'Unnamed User'}</span>
                        {user.designation && (
                          <span className="text-xs text-muted-foreground">{user.designation}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeClass(user.role)}>
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department ? (
                        <Badge variant="outline" className="bg-muted/50">
                          <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                          {user.department}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUser(user)}
                          title="View details"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        
                        <Dialog open={isEditDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedUser(user)}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Make changes to user profile
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                              <Tabs defaultValue="basic">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                  <TabsTrigger value="details">Additional Details</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="basic" className="space-y-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input
                                      id="edit-name"
                                      className="col-span-3"
                                      value={selectedUser.name || ''}
                                      onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-email" className="text-right">Email</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      className="col-span-3"
                                      value={selectedUser.email || ''}
                                      onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-role" className="text-right">Role</Label>
                                    <Select
                                      value={selectedUser.role}
                                      onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                                    >
                                      <SelectTrigger id="edit-role" className="col-span-3">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="approver">Approver</SelectItem>
                                        <SelectItem value="checker">Checker</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="details" className="space-y-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-department" className="text-right">Department</Label>
                                    <Input
                                      id="edit-department"
                                      className="col-span-3"
                                      value={selectedUser.department || ''}
                                      onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-designation" className="text-right">Designation</Label>
                                    <Input
                                      id="edit-designation"
                                      className="col-span-3"
                                      value={selectedUser.designation || ''}
                                      onChange={(e) => setSelectedUser({...selectedUser, designation: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="edit-notes" className="text-right pt-2">Notes</Label>
                                    <Textarea
                                      id="edit-notes"
                                      className="col-span-3"
                                      value={selectedUser.notes || ''}
                                      onChange={(e) => setSelectedUser({...selectedUser, notes: e.target.value})}
                                      placeholder="Additional notes about this user"
                                    />
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                            
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsEditDialogOpen(false);
                                  setSelectedUser(null);
                                }}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleEditUser}
                                disabled={isProcessing || !selectedUser?.name || !selectedUser?.email}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : 'Save Changes'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={isDeleteDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setSelectedUser(user)}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                              <div className="py-4">
                                <div className="flex items-center gap-4 p-4 border rounded-md bg-red-50">
                                  <Avatar>
                                    <AvatarFallback className="bg-red-100 text-red-700">
                                      {getInitials(selectedUser.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{selectedUser.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    <div className="flex items-center mt-1">
                                      <Badge className={getRoleBadgeClass(selectedUser.role)}>
                                        {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                                      </Badge>
                                      {selectedUser.department && (
                                        <Badge variant="outline" className="ml-2">
                                          {selectedUser.department}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-red-600 mt-4">
                                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                                  Deleting this user will remove their access to the system and all associated data.
                                </p>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsDeleteDialogOpen(false);
                                  setSelectedUser(null);
                                }}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleDeleteUser}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : 'Delete User'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
      
      <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
        <div>
          Total users: {users.length}
        </div>
        <div>
          Showing {filteredUsers.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredUsers.length)} of ` : ''}{filteredUsers.length} users
        </div>
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete information about this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {selectedUser.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={getRoleBadgeClass(selectedUser.role)}>
                      <div className="flex items-center">
                        {getRoleIcon(selectedUser.role)}
                        {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="font-medium">
                      {selectedUser.department || 'Not assigned'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Designation</p>
                    <p className="font-medium">
                      {selectedUser.designation || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={selectedUser.active !== false ? "default" : "secondary"}>
                      {selectedUser.active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                {selectedUser.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">
                      {selectedUser.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}