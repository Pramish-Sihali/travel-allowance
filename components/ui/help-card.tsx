import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface HelpCardProps {
  title: string;
  description: string;
  email: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  icon?: ReactNode;
}

export function HelpCard({
  title,
  description,
  email,
  bgColor = "bg-blue-50",
  borderColor = "border-blue-200",
  textColor = "text-blue-700",
  icon = <Mail size={14} />
}: HelpCardProps) {
  return (
    <Card className={`${bgColor} border ${borderColor}`}>
      <CardContent className="p-4">
        <h3 className={`font-medium text-blue-800 mb-2`}>{title}</h3>
        <p className={`${textColor} text-sm mb-3`}>
          {description}
        </p>
        <Button variant="link" asChild className={`p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center gap-1`}>
          <a href={`mailto:${email}`}>
            {icon}
            {email}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}