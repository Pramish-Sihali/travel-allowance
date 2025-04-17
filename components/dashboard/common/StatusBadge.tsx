// components/dashboard/common/StatusBadge.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass, getFormattedStatus } from '../data/statusMappings';
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Renders a status badge with appropriate styling based on status
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <Badge className={cn(getStatusBadgeClass(status), className)}>
      {getFormattedStatus(status)}
    </Badge>
  );
};

export default StatusBadge;