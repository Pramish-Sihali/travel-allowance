// components/dashboard/common/SkeletonLoader.tsx
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  withHeader?: boolean;
  headerWidths?: string[];
  cellWidths?: string[];
  rowHeight?: string;
}

/**
 * Renders a skeleton loader for tables
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 7,
  withHeader = true,
  headerWidths = [],
  cellWidths = [],
  rowHeight = "h-4"
}) => {
  // Default width if not specified
  const getHeaderWidth = (index: number) => headerWidths[index] || 'w-1/2';
  const getCellWidth = (index: number) => cellWidths[index] || 'w-1/2';

  return (
    <div className="rounded-md border">
      <Table>
        {withHeader && (
          <TableHeader>
            <TableRow>
              {Array(columns).fill(0).map((_, index) => (
                <TableHead key={index} className={index === 0 ? "w-[180px]" : ""}>
                  <Skeleton className={`${rowHeight} ${getHeaderWidth(index)}`} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array(rows).fill(0).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array(columns).fill(0).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={`${colIndex === 0 ? "h-10 w-3/4" : `${rowHeight} ${getCellWidth(colIndex)}`}`} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
  layout?: 'grid' | 'flex';
  className?: string;
}

/**
 * Renders skeleton loaders for cards
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 4,
  layout = 'grid',
  className
}) => {
  return (
    <div 
      className={layout === 'grid' 
        ? `grid grid-cols-1 md:grid-cols-${Math.min(count, 4)} gap-4 ${className}` 
        : `flex flex-col gap-4 ${className}`
      }
    >
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="border rounded-md p-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
};

export default { TableSkeleton, CardSkeleton };