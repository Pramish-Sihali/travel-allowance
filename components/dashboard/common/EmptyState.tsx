// components/dashboard/common/EmptyState.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  iconClassName?: string;
}

/**
 * Renders an empty state with icon, title, description and optional action button
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  iconClassName
}) => {
  return (
    <div className={cn("text-center py-12 border rounded-lg", className)}>
      <Icon className={cn("mx-auto h-12 w-12 text-muted-foreground mb-4", iconClassName)} />
      <p className="text-lg font-medium text-muted-foreground mb-2">{title}</p>
      {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;