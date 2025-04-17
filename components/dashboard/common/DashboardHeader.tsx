// components/dashboard/common/DashboardHeader.tsx
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import FilterControls from './FilterControls';
import { getStatusFilterOptionsByRole } from '../data/statusMappings';
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  role: 'employee' | 'approver' | 'checker';
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Renders a consistent header for all dashboard types
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  icon: Icon,
  role,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  loading = false,
  children,
  className
}) => {
  // Get status options based on role
  const statusOptions = getStatusFilterOptionsByRole(role);
  
  return (
    <CardHeader className={className}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="flex items-center">
          <Icon className="mr-2 text-primary h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <FilterControls
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            typeFilter={typeFilter}
            onTypeFilterChange={onTypeFilterChange}
            onRefresh={onRefresh}
            loading={loading}
            statusOptions={statusOptions}
            searchPlaceholder={`Search ${role === 'employee' ? 'my' : ''} requests...`}
          />
          
          {children}
        </div>
      </div>
      
      {description && (
        <CardDescription>
          {description}
        </CardDescription>
      )}
    </CardHeader>
  );
};

export default DashboardHeader;