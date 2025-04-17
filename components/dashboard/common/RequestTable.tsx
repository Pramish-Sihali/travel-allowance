// components/dashboard/common/RequestTable.tsx
import React, { ReactNode } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ArrowUpDown, Calendar, Clock, DollarSign, FileText, LucideIcon, Users } from 'lucide-react';
import { TravelRequest } from '@/types';
import { SortConfig, toggleSort } from '../utils/sortingHelpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import UserAvatar from './UserAvatar';
import RequestTypeBadge from './RequestTypeBadge';
import StatusBadge from './StatusBadge';
import RequestActions from './RequestActions';
import { formatCurrency, formatDate, formatDateRange, truncateText } from '../utils/formatters';
import { TableSkeleton } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { cn } from "@/lib/utils";

export interface TableColumn {
  key: string;
  title: string;

  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
  render?: (request: TravelRequest) => ReactNode;
   icon?: LucideIcon; 
}

interface RequestTableProps {
  requests: TravelRequest[];
  loading: boolean;
  onViewDetails: (request: TravelRequest) => void;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  emptyStateProps?: {
    icon: LucideIcon;
    title: string;
    description: string;
  };
  variant: 'employee' | 'approver' | 'checker';
  mode: 'current' | 'pending' | 'completed' | 'past';
  showDepartment?: boolean;
  showSubmittedDate?: boolean;
  actionVariant?: 'review' | 'verify' | 'view';
  actionLabel?: string;
  className?: string;
  compact?: boolean;
  columns?: TableColumn[];
  showTotal?: boolean;
  rowClassName?: (request: TravelRequest) => string;
  onRowClick?: (request: TravelRequest) => void;
}

/**
 * Renders a table of requests with sorting, filtering, and actions
 */
const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  loading,
  onViewDetails,
  sortConfig,
  onSort,
  emptyStateProps,
  variant,
  mode,
  showDepartment = true,
  showSubmittedDate = false,
  actionVariant = 'view',
  actionLabel,
  className,
  compact = false,
  columns,
  showTotal = false,
  rowClassName,
  onRowClick
}) => {
  // Handle sort click
  const handleSort = (key: string) => {
    onSort(key);
  };

  // Get sort indicator component
  const getSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown size={14} className="ml-1 text-primary rotate-0" />;
    }
    
    return <ArrowUpDown size={14} className="ml-1 text-primary rotate-180" />;
  };

  // Get default columns if not provided
  const getDefaultColumns = (): TableColumn[] => {
    const defaultColumns: TableColumn[] = [
      {
        key: 'employeeName',
        title: 'Employee',
        icon: Users,
        sortable: true,
        render: (request) => <UserAvatar name={request.employeeName} withName />
      },
      {
        key: 'requestType',
        title: 'Type',
        icon: FileText,
        sortable: true,
        render: (request) => <RequestTypeBadge type={request.requestType} />
      },
      {
        key: 'department',
        title: 'Department',
        sortable: true,
        visible: showDepartment,
        render: (request) => <span className="text-muted-foreground">{request.department}</span>
      },
      {
        key: mode === 'completed' || showSubmittedDate ? 'createdAt' : 'travelDateFrom',
        title: mode === 'completed' || showSubmittedDate ? 'Submitted' : 'Dates',
        icon: Calendar,
        sortable: true,
        render: (request) => {
          if (mode === 'completed' || showSubmittedDate) {
            return <div>{formatDate(request.createdAt)}</div>;
          } else if (request.requestType === 'in-valley') {
            return <div>{formatDate(request.expenseDate || request.travelDateFrom)}</div>;
          } else {
            return (
              <div className="flex flex-col">
                <span>{formatDate(request.travelDateFrom, { month: 'short', day: 'numeric' })}</span>
                <span className="text-xs text-muted-foreground">
                  to {formatDate(request.travelDateTo, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          }
        }
      },
      {
        key: 'purpose',
        title: 'Purpose',
        sortable: false,
        render: (request) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate">{request.purpose}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{request.purpose}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      {
        key: 'totalAmount',
        title: 'Amount',
        icon: DollarSign,
        sortable: true,
        render: (request) => (
          <span className="font-medium">{formatCurrency(request.totalAmount)}</span>
        )
      },
      {
        key: 'status',
        title: 'Status',
        icon: Clock,
        sortable: true,
        visible: mode === 'completed' || mode === 'past',
        render: (request) => <StatusBadge status={request.status} />
      },
      {
        key: 'actions',
        title: 'Actions',
        align: 'right',
        render: (request) => (
          <RequestActions
            variant={actionVariant}
            onClick={() => onViewDetails(request)}
            label={actionLabel}
          />
        )
      }
    ];

    return defaultColumns.filter(col => col.visible !== false);
  };

  // Use provided columns or default ones
  const tableColumns = columns || getDefaultColumns();

  // If loading, show skeleton
  if (loading) {
    return <TableSkeleton />;
  }

  // If no requests, show empty state
  if (requests.length === 0 && emptyStateProps) {
    const { icon, title, description } = emptyStateProps;
    return <EmptyState icon={icon} title={title} description={description} />;
  }

  // Calculate total amount if showing total
  const totalAmount = showTotal ? 
    requests.reduce((sum, req) => sum + (req.totalAmount || 0), 0) : 0;

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader className={compact ? "bg-muted/10" : ""}>
          <TableRow>
            {tableColumns.map((column) => {
              const Icon = column.icon;
              
              return (
                <TableHead 
                  key={column.key}
                  className={cn(
                    column.sortable ? "cursor-pointer" : "",
                    column.width,
                    column.align === 'right' ? "text-right" : 
                    column.align === 'center' ? "text-center" : ""
                  )}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {Icon && <Icon size={16} className="mr-2 text-muted-foreground" />}
                    {column.title}
                    {column.sortable && getSortIndicator(column.key)}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow 
              key={request.id} 
              className={cn(
                "group", 
                onRowClick ? "cursor-pointer hover:bg-muted/50" : "",
                rowClassName ? rowClassName(request) : ""
              )}
              onClick={onRowClick ? () => onRowClick(request) : undefined}
            >
              {tableColumns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={cn(
                    column.align === 'right' ? "text-right" : 
                    column.align === 'center' ? "text-center" : ""
                  )}
                >
                  {column.render ? column.render(request) : (request as any)[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {/* Total row if needed */}
          {showTotal && (
            <TableRow className="font-bold bg-muted/30">
              <TableCell colSpan={tableColumns.length - 2} className="text-right">Total</TableCell>
              <TableCell className="text-primary font-bold">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestTable;