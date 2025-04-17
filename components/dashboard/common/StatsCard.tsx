// components/dashboard/common/StatsCard.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  valuePrefix?: string;
  subtitle?: string;
  borderColor?: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

/**
 * Renders a stats card with icon, title, and value
 */
const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  valuePrefix = '',
  subtitle,
  borderColor = 'border-l-blue-400',
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  className
}) => {
  return (
    <Card className={cn(`border-l-4 ${borderColor}`, className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(`p-3 rounded-full ${iconBgColor}`)}>
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold">
              {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;