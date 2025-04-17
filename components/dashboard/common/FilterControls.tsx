// components/dashboard/common/FilterControls.tsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { requestTypeFilterOptions } from '../data/requestTypeMappings';

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  statusOptions: { value: string; label: string }[];
  variant?: 'row' | 'column';
  searchPlaceholder?: string;
}

/**
 * Renders filter controls for requests
 */
const FilterControls: React.FC<FilterControlsProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  loading = false,
  statusOptions,
  variant = 'row',
  searchPlaceholder = 'Search requests...'
}) => {
  return (
    <div className={`flex ${variant === 'column' ? 'flex-col' : 'flex-col sm:flex-row'} gap-3 w-full sm:w-auto`}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full sm:w-[250px]"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Status filter" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={typeFilter}
          onValueChange={onTypeFilterChange}
        >
          <SelectTrigger className="w-[150px]">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Type filter" />
          </SelectTrigger>
          <SelectContent>
            {requestTypeFilterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline"
          onClick={onRefresh} 
          disabled={loading}
          size="icon"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;