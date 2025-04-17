// components/dashboard/common/RequestTypeBadge.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  getRequestTypeLabel, 
  getRequestTypeBadgeClass, 
  getTypeIcon
} from '../data/requestTypeMappings';
import { cn } from "@/lib/utils";

interface RequestTypeBadgeProps {
  type: string | undefined;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders a request type badge with appropriate styling and icon
 */
const RequestTypeBadge: React.FC<RequestTypeBadgeProps> = ({ 
  type,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const IconComponent = getTypeIcon(type);
  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  return (
    <Badge
      className={cn(
        "flex items-center gap-1.5 w-fit",
        getRequestTypeBadgeClass(type),
        className
      )}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {getRequestTypeLabel(type)}
    </Badge>
  );
};

export default RequestTypeBadge;