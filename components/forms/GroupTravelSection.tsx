'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Users,
  UserPlus,
  X,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define user type for group travel members
interface UserOption {
  id: string;
  name: string;
  department?: string;
  designation?: string;
  email?: string;
}

// GroupTravelSection Component
const GroupTravelSection = ({ 
  form, 
  userOptions, 
  loadingUsers,
  selectedMembers,
  setSelectedMembers
}: { 
  form: any, 
  userOptions: UserOption[],
  loadingUsers: boolean,
  selectedMembers: UserOption[],
  setSelectedMembers: React.Dispatch<React.SetStateAction<UserOption[]>>
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Filter users based on search term
  const filteredUsers = userOptions?.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Add member to selected members
  const addMember = (user: UserOption) => {
    if (!selectedMembers.some(member => member.id === user.id)) {
      const newMembers = [...selectedMembers, user];
      setSelectedMembers(newMembers);
      
      // Update the form value with IDs
      form.setValue('groupMembers', newMembers.map(member => member.id));
    }
    setSearchTerm('');
    setShowDropdown(false);
  };
  
  // Remove member from selected members
  const removeMember = (userId: string) => {
    const newMembers = selectedMembers.filter(member => member.id !== userId);
    setSelectedMembers(newMembers);
    
    // Update the form value with IDs
    form.setValue('groupMembers', newMembers.map(member => member.id));
  };
  
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <UsersRound className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Group Travel Details</h3>
      </div>
      
      <div className="p-4 border rounded-md bg-muted/10">
        <div className="mb-3">
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Only to be filled by Group Captain
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Group Size */}
          <FormField
            control={form.control}
            name="groupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Number of People</span>
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    {...field}
                    placeholder="Enter total number of people"
                    disabled={!form.watch('isGroupCaptain')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Group Members Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Group Members</span>
            </Label>
            
            <div className="relative">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setShowDropdown(true);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={!form.watch('isGroupCaptain') || loadingUsers}
              />
              
              {/* User dropdown for selection */}
              {showDropdown && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border max-h-60 overflow-auto">
                  {loadingUsers ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                        <span>Loading employees...</span>
                      </div>
                    </div>
                  ) : !userOptions || userOptions.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No employees available
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No matching employees found
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => addMember(user)}
                      >
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.email && (
                            <div className="text-xs text-gray-500">{user.email}</div>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            addMember(user);
                          }}
                        >
                          <UserPlus size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Selected members */}
            <div className="mt-2 space-y-2">
              {selectedMembers.length > 0 ? (
                <div className="border rounded-md p-2">
                  <p className="text-sm text-gray-500 mb-2">Selected members:</p>
                  <div className="space-y-1">
                    {selectedMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          {member.department && (
                            <div className="text-xs text-gray-500">{member.department}</div>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeMember(member.id)}
                          disabled={!form.watch('isGroupCaptain')}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members selected yet</p>
              )}
            </div>
          </div>
          
          {/* Group Description */}
          <FormField
            control={form.control}
            name="groupDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Travel Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe the purpose and details of this group travel" 
                    className="resize-none min-h-[100px]"
                    disabled={!form.watch('isGroupCaptain')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default GroupTravelSection;