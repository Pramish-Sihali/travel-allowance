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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ArrowUpDown
} from 'lucide-react';
import { UserRole } from '@/types';

export default function AdminUsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // User management state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    department: ''
  });
  
  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
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
        user.name?.toLowerCase().includes(lowerCaseSearch) ||
        user.email?.toLowerCase().includes(lowerCaseSearch) ||
        user.department?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
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
  
  // Function to handle adding a new user
  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      const newUserData = await response.json();
      setUsers([...users, newUserData]);
      setIsAddDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: ''
      });
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };
  
  // Function to handle editing a user
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
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
      alert('Failed to update user. Please try again.');
    }
  };
  
  // Function to handle deleting a user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove the user from the array
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
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
  
  const filteredUsers = getFilteredUsers();
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
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
          
          <Button 
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account in the system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Name</label>
                <Input
                  className="col-span-3"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Email</label>
                <Input
                  type="email"
                  className="col-span-3"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Password</label>
                <Input
                  type="password"
                  className="col-span-3"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Role</label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                >
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Department</label>
                <Input
                  className="col-span-3"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleAddUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No users found</p>
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeClass(user.role)}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isEditDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Make changes to user profile
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedUser && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right">Name</label>
                                <Input
                                  className="col-span-3"
                                  value={selectedUser.name}
                                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right">Email</label>
                                <Input
                                  type="email"
                                  className="col-span-3"
                                  value={selectedUser.email}
                                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right">Role</label>
                                <Select
                                  value={selectedUser.role}
                                  onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                                >
                                  <SelectTrigger className="col-span-3">
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
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right">Department</label>
                                <Input
                                  className="col-span-3"
                                  value={selectedUser.department || ''}
                                  onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                                />
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsEditDialogOpen(false);
                              setSelectedUser(null);
                            }}>Cancel</Button>
                            <Button onClick={handleEditUser}>Save Changes</Button>
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
                                <UserX className="h-6 w-6 text-red-500" />
                                <div>
                                  <p className="font-medium">{selectedUser.name}</p>
                                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsDeleteDialogOpen(false);
                              setSelectedUser(null);
                            }}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
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
      )}
      
      <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
        <div>
          Total users: {users.length}
        </div>
        <div>
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}