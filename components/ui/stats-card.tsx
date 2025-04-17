import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  icon: ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  label: string;
  value: string | number;
}

export function StatsCard({
  icon,
  iconColor,
  bgColor,
  borderColor,
  label,
  value
}: StatsCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${bgColor}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}