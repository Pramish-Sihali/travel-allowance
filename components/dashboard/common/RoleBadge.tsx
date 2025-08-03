// components/dashboard/common/RoleBadge.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  Eye, 
  User 
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Get role badge styling classes
 */
const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'approver':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'checker':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'employee':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Get role icon
 */
const getRoleIcon = (role: string) => {
  const iconProps = { className: "h-3 w-3 mr-1" };
  
  switch (role) {
    case 'admin':
      return <Shield {...iconProps} />;
    case 'approver':
      return <CheckCircle {...iconProps} />;
    case 'checker':
      return <Eye {...iconProps} />;
    case 'employee':
      return <User {...iconProps} />;
    default:
      return <User {...iconProps} />;
  }
};

/**
 * Renders a role badge with appropriate styling and icon
 */
const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const formattedRole = role?.charAt(0).toUpperCase() + role?.slice(1);
  
  return (
    <Badge className={cn(getRoleBadgeClass(role), className)}>
      <div className="flex items-center">
        {showIcon && getRoleIcon(role)}
        {formattedRole}
      </div>
    </Badge>
  );
};

export default RoleBadge;