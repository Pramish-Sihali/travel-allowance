// File: /components/forms/EmployeeInfoSection.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UserIcon, BadgeInfo, Building, BriefcaseBusiness } from "lucide-react";

// This component expects to receive the form object as a prop
export default function EmployeeInfoSection({ form }: { form: any }) {
  const { data: session, status } = useSession();
  
  // This useEffect will populate the form fields when session is authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      form.setValue('employeeId', session.user.id);
      
      if (session.user.name) {
        form.setValue('employeeName', session.user.name);
      }
      
      // Fetch user profile data
      const fetchUserProfile = async () => {
        try {
          // Fixed API endpoint path: changed from /api/users/ to /api/user/
          const response = await fetch(`/api/user/${session.user.id}/profile`);
          if (response.ok) {
            const userData = await response.json();
            
            // Debug - log the data we're receiving
            console.log('User profile data received:', userData);
            
            // Update form with fetched data
            if (userData) {
              // Set department and designation if they exist in the response
              if (userData.department) {
                form.setValue('department', userData.department);
              }
              if (userData.designation) {
                form.setValue('designation', userData.designation);
              }
            }
          } else {
            console.error('Failed to fetch user profile data:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [session, status, form]);
  
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <UserIcon className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Employee Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="employeeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <BadgeInfo className="h-4 w-4 mr-2 text-muted-foreground" />
                Full Name
              </FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                Department
              </FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <BriefcaseBusiness className="h-4 w-4 mr-2 text-muted-foreground" />
                Designation
              </FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}