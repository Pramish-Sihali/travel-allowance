// components/dashboard/common/ChecklistPanel.tsx
import React, { ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Check } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  title: string;
  description?: string;
  icon?: LucideIcon;
  completed?: boolean;
  important?: boolean;
}

export interface ChecklistSection {
  title: string;
  icon: LucideIcon;
  description?: string;
  items: ChecklistItem[];
}

interface ChecklistPanelProps {
  sections: ChecklistSection[];
  variant?: 'default' | 'compact' | 'outlined';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
}

/**
 * A panel for displaying checklists or guidelines
 */
const ChecklistPanel: React.FC<ChecklistPanelProps> = ({
  sections,
  variant = 'default',
  className,
  headerClassName,
  contentClassName,
  itemClassName
}) => {
  // Get variant styling
  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return {
          header: "pb-3 bg-muted/30",
          content: "",
          title: "text-base flex items-center gap-2",
          item: "p-2"
        };
      case 'outlined':
        return {
          header: "pb-3 border-b",
          content: "",
          title: "text-base flex items-center gap-2",
          item: "p-3 border rounded-md"
        };
      default:
        return {
          header: "pb-3 bg-muted/30",
          content: "",
          title: "text-base flex items-center gap-2",
          item: "p-3"
        };
    }
  };

  const variantClass = getVariantClass();
  
  return (
    <Card className={cn("shadow-sm", className)}>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          <CardHeader className={cn(variantClass.header, headerClassName)}>
            <CardTitle className={variantClass.title}>
              <section.icon size={16} className="text-primary" />
              {section.title}
            </CardTitle>
            {section.description && (
              <CardDescription>{section.description}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent className={cn(contentClassName)}>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const ItemIcon = item.icon || Check;
                
                return (
                  <div 
                    key={itemIndex} 
                    className={cn(
                      "bg-muted/10 flex items-start gap-2",
                      item.important ? "border-l-2 border-l-primary pl-2" : "",
                      variantClass.item,
                      itemClassName
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <ItemIcon 
                        size={16} 
                        className={cn(
                          item.completed ? "text-green-600" : "text-primary",
                          item.important ? "text-primary" : ""
                        )} 
                      />
                    </div>
                    <div>
                      <p className={cn("font-medium", item.important ? "text-primary" : "")}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </React.Fragment>
      ))}
    </Card>
  );
};

export default ChecklistPanel;