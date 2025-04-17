// components/dashboard/common/RequestTabs.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from 'lucide-react';
import { tabIconsMap } from '../data/iconMappings';
import { cn } from "@/lib/utils";

export interface TabConfig {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  hideTextOnMobile?: boolean;
  content?: React.ReactNode;
}

interface RequestTabsProps {
  tabs: TabConfig[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange: (tabId: string) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'boxed' | 'bordered';
  tabListClassName?: string;
  tabContentClassName?: string;
}

/**
 * Renders tabs for request management dashboards
 */
const RequestTabs: React.FC<RequestTabsProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  children,
  className,
  variant = 'default',
  tabListClassName,
  tabContentClassName
}) => {
  // Get styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'boxed':
        return {
          tabsList: "w-full sm:w-auto grid grid-cols-3 sm:inline-flex",
          wrapper: "border-b bg-muted/5 px-6 py-2",
          tabs: className
        };
      case 'bordered':
        return {
          tabsList: "mb-4",
          wrapper: "",
          tabs: className
        };
      default:
        return {
          tabsList: "mb-4",
          wrapper: "",
          tabs: className
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Tabs 
      defaultValue={defaultTab || tabs[0].id} 
      value={activeTab}
      onValueChange={onTabChange}
      className={styles.tabs}
    >
      <div className={styles.wrapper}>
        <TabsList className={cn(styles.tabsList, tabListClassName)}>
          {tabs.map(tab => {
            const { id, label, icon, count, hideTextOnMobile } = tab;
            // Use provided icon or get from mapping
            const Icon = icon || tabIconsMap[id] || tabIconsMap.details;
            
            return (
              <TabsTrigger 
                key={id} 
                value={id} 
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className={hideTextOnMobile ? "hidden sm:inline" : ""}>
                  {label}
                </span>
                {count !== undefined && (
                  <Badge variant="secondary" className="ml-1">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      
      {/* Render children or tab content directly */}
      {children ? (
        children
      ) : (
        tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className={cn("m-0", tabContentClassName)}>
            {tab.content}
          </TabsContent>
        ))
      )}
    </Tabs>
  );
};

export default RequestTabs;