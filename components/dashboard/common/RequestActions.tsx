// components/dashboard/common/RequestActions.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface RequestActionsProps {
  variant: 'review' | 'verify' | 'view';
  onClick: () => void;
  className?: string;
  label?: string;
}

/**
 * Renders action buttons for requests based on role
 */
const RequestActions: React.FC<RequestActionsProps> = ({
  variant,
  onClick,
  className,
  label
}) => {
  // Define button variants based on role
  const buttonVariants = {
    review: {
      variant: 'default' as const,
      label: label || 'Review',
      size: 'sm' as const
    },
    verify: {
      variant: 'default' as const,
      label: label || 'Verify',
      size: 'sm' as const
    },
    view: {
      variant: 'outline' as const, 
      label: label || 'View',
      size: 'sm' as const
    }
  };

  const { variant: buttonVariant, label: buttonLabel, size } = buttonVariants[variant];

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={onClick}
      className={cn("opacity-80 group-hover:opacity-100", className)}
    >
      {buttonLabel}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
};

export default RequestActions;