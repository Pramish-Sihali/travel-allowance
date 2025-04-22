// components/dashboard/common/ActionPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  Info, 
  Loader2 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { TravelRequest } from '@/types';

interface ActionPanelProps {
  request: TravelRequest;
  comments: string;
  setComments: (comments: string) => void;
  onAction: (action: string) => void;
  isSubmitting: boolean;
  onBack?: () => void;
  title: string;
  description: string;
  statusMessage: {
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null;
  actions: {
    key: string;
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'custom';
  }[];
  disableActions?: boolean;
  disableReason?: string;
  commentsLabel?: string;
  commentsPlaceholder?: string;
  hideBackButton?: boolean;
}

export default function ActionPanel({
  request,
  comments,
  setComments,
  onAction,
  isSubmitting,
  onBack,
  title,
  description,
  statusMessage,
  actions,
  disableActions = false,
  disableReason,
  commentsLabel = "Comments",
  commentsPlaceholder = "Add your comments or notes...",
  hideBackButton = false
}: ActionPanelProps) {
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  
  // Reset the submitting action state when the isSubmitting prop changes to false
  useEffect(() => {
    if (!isSubmitting) {
      setSubmittingAction(null);
    }
  }, [isSubmitting]);
  
  const handleActionClick = (actionKey: string) => {
    setSubmittingAction(actionKey);
    onAction(actionKey);
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {statusMessage && (
          <Alert className={cn(
            statusMessage.type === 'success' ? "bg-green-50 text-green-800 border-green-200" :
            statusMessage.type === 'error' ? "bg-red-50 text-red-800 border-red-200" :
            statusMessage.type === 'warning' ? "bg-amber-50 text-amber-800 border-amber-200" :
            "bg-blue-50 text-blue-800 border-blue-200"
          )}>
            {statusMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {statusMessage.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
            {statusMessage.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            {statusMessage.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
            
            {statusMessage.title && <AlertTitle>{statusMessage.title}</AlertTitle>}
            <AlertDescription>{statusMessage.message}</AlertDescription>
          </Alert>
        )}
        
        <div>
          <div className="mb-2 flex items-center">
            <h3 className="text-base font-medium">{commentsLabel}</h3>
          </div>
          <Textarea 
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={commentsPlaceholder}
            className="min-h-[120px]"
            disabled={isSubmitting}
          />
        </div>
        
        {disableActions && disableReason && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              {disableReason}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-end mt-6">
          {!hideBackButton && onBack && (
            <Button
              variant="ghost"
              className="flex items-center gap-2 mr-auto"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            {actions.map((action) => (
              <Button
                key={action.key}
                onClick={() => handleActionClick(action.key)}
                disabled={disableActions || isSubmitting}
                variant={action.variant === 'custom' ? 'outline' : action.variant}
                className={cn(
                  "flex items-center gap-2",
                  action.key === 'reject' && "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700",
                  action.key === 'approve' && "bg-green-600 hover:bg-green-700"
                )}
              >
                {isSubmitting && submittingAction === action.key ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action.icon && <action.icon className="h-5 w-5" />}
                    {action.label}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}