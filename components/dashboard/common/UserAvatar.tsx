// components/dashboard/common/UserAvatar.tsx
import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from '../utils/requestHelpers';
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackClassName?: string;
  withName?: boolean;
  nameClassName?: string;
}

/**
 * Renders a user avatar with initials fallback
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 'md',
  className,
  fallbackClassName,
  withName = false,
  nameClassName
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback 
          className={cn(
            "bg-primary/10 text-primary", 
            textSizeClasses[size],
            fallbackClassName
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      {withName && (
        <div className={cn("font-medium", nameClassName)}>
          {name}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;