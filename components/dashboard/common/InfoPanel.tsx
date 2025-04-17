// components/dashboard/common/InfoPanel.tsx
import React, { ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface InfoItem {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  variant?: 'default' | 'badge' | 'highlight' | 'secondary';
  labelClassName?: string;
  valueClassName?: string;
}

export interface InfoSection {
  title: string;
  icon?: LucideIcon;
  items: InfoItem[];
  gridCols?: 1 | 2 | 3 | 4;
}

interface InfoPanelProps {
  sections: InfoSection[];
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'bordered' | 'shadowed';
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  className?: string;
  actions?: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
  }[];
  children?: ReactNode;
}

/**
 * A flexible panel for displaying structured information
 */
const InfoPanel: React.FC<InfoPanelProps> = ({
  sections,
  title,
  description,
  icon: HeaderIcon,
  variant = 'default',
  headerClassName,
  contentClassName,
  footerClassName,
  className,
  actions = [],
  children
}) => {
  // Get panel variant styling
  const getPanelVariantClass = () => {
    switch (variant) {
      case 'bordered':
        return 'border rounded-md shadow-sm';
      case 'shadowed':
        return 'border rounded-md shadow-md';
      default:
        return '';
    }
  };

  // Get item variant styling
  const getItemVariantClass = (itemVariant: InfoItem['variant'] = 'default') => {
    switch (itemVariant) {
      case 'badge':
        return {
          value: 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary'
        };
      case 'highlight':
        return {
          value: 'font-medium text-primary'
        };
      case 'secondary':
        return {
          value: 'text-muted-foreground'
        };
      default:
        return {
          value: 'font-medium'
        };
    }
  };

  return (
    <div className={cn(getPanelVariantClass(), className)}>
      {/* Header (if provided) */}
      {(title || description) && (
        <div className={cn("flex items-center justify-between p-4 border-b", headerClassName)}>
          <div className="flex items-center gap-2">
            {HeaderIcon && <HeaderIcon className="h-5 w-5 text-primary" />}
            <div>
              {title && <h3 className="text-lg font-medium">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn("p-4 space-y-6", contentClassName)}>
        {sections.map((section, sectionIndex) => {
          const { title, icon: SectionIcon, items, gridCols = 1 } = section;
          
          return (
            <div key={sectionIndex} className="space-y-4">
              {/* Section header */}
              <div className="flex items-center gap-2">
                {SectionIcon && <SectionIcon className="h-5 w-5 text-primary" />}
                <h4 className="text-lg font-medium">{title}</h4>
              </div>
              
              {/* Section content */}
              <div className={cn(
                "bg-muted/10 p-4 rounded-md border",
                `grid grid-cols-1 md:grid-cols-${gridCols} gap-4`
              )}>
                {items.map((item, itemIndex) => {
                  const { label, value, icon: ItemIcon, variant: itemVariant, labelClassName, valueClassName } = item;
                  const variantClass = getItemVariantClass(itemVariant);
                  
                  return (
                    <div key={itemIndex} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                        <p className={cn("text-sm text-muted-foreground", labelClassName)}>
                          {label}
                        </p>
                      </div>
                      <div className={cn(variantClass.value, valueClassName)}>
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Additional content */}
        {children}
      </div>

      {/* Footer with actions (if provided) */}
      {actions.length > 0 && (
        <div className={cn("flex justify-end gap-2 p-4 border-t", footerClassName)}>
          {actions.map((action, index) => {
            const { icon: ActionIcon, label, onClick } = action;
            
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={onClick}
                className="flex items-center gap-1.5"
              >
                <ActionIcon className="h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InfoPanel;