// components/dashboard/common/ExpensesTable.tsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Paperclip,
  Download,
  Image,
  FileText,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getCategoryIcon } from '../data/iconMappings';
import { cn } from "@/lib/utils";

// Define interfaces for expense item and receipt
export interface ExpenseItem {
  id: string;
  requestId: string;
  category: string;
  amount: number;
  description?: string;
}

export interface ReceiptFile {
  id: string;
  expenseItemId: string;
  originalFilename: string;
  fileType: string;
  publicUrl: string;
  uploadDate: string;
}

interface ExpensesTableProps {
  expenseItems: ExpenseItem[];
  receipts: Record<string, ReceiptFile[]>;
  totalAmount: number;
  previousOutstandingAdvance?: number;
  showTotal?: boolean;
  showCombinedTotal?: boolean;
  allowReceiptPreview?: boolean;
  showReceiptCount?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  tableClassName?: string;
}

/**
 * A reusable table for displaying expense items and their associated receipts
 */
const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenseItems,
  receipts,
  totalAmount,
  previousOutstandingAdvance = 0,
  showTotal = true,
  showCombinedTotal = true,
  allowReceiptPreview = true,
  showReceiptCount = false,
  emptyState,
  className,
  tableClassName
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptFile | null>(null);

  // Format category name (e.g., "ride-share" -> "Ride Share")
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    return totalAmount + previousOutstandingAdvance;
  };

  // Check if a file is an image
  const isImageFile = (fileType?: string) => {
    if (!fileType) return false;
    return fileType.startsWith('image/');
  };

  // Render receipt preview dialog content
  const renderReceiptPreview = (receipt: ReceiptFile) => {
    return (
      <div className="mt-4 flex flex-col items-center">
        {isImageFile(receipt.fileType) && receipt.publicUrl ? (
          <div className="border rounded-md overflow-hidden max-h-[70vh] flex items-center justify-center">
            <img 
              src={receipt.publicUrl} 
              alt={receipt.originalFilename}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        ) : (
          <div className="p-8 bg-muted/10 rounded-md text-center">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="mb-4">This file type cannot be previewed.</p>
          </div>
        )}
        
        <div className="flex justify-center mt-4">
          <Button asChild variant="secondary">
            <a 
              href={receipt.publicUrl || '#'} 
              download={receipt.originalFilename}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={16} className="mr-2" />
              Download Receipt
            </a>
          </Button>
        </div>
      </div>
    );
  };

  // Render receipt preview button
  const renderReceiptButton = (receipt: ReceiptFile, index: number) => {
    if (allowReceiptPreview) {
      return (
        <Dialog key={receipt.id}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex items-center gap-1 text-primary"
              onClick={() => setSelectedReceipt(receipt)}
            >
              {isImageFile(receipt.fileType) ? (
                <Image size={14} />
              ) : (
                <Paperclip size={14} />
              )}
              <span className="truncate max-w-[150px] text-xs">
                {showReceiptCount ? `Receipt ${index + 1}` : receipt.originalFilename}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Receipt: {receipt.originalFilename}</DialogTitle>
              <DialogDescription>
                Uploaded on {new Date(receipt.uploadDate).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            {renderReceiptPreview(receipt)}
          </DialogContent>
        </Dialog>
      );
    } else {
      return (
        <a
          key={receipt.id}
          href={receipt.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs py-1 px-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
        >
          <Paperclip size={12} />
          {showReceiptCount ? `Receipt ${index + 1}` : receipt.originalFilename}
        </a>
      );
    }
  };

  // If no expense items, show the empty state
  if (expenseItems.length === 0 && emptyState) {
    return (
      <div className={className}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn("rounded-md border overflow-hidden", tableClassName)}>
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Receipts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseItems.map((item, index) => {
              const CategoryIcon = getCategoryIcon(item.category);
              
              return (
                <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-primary" />
                      <span>{formatCategoryName(item.category)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.description || 
                      <span className="text-muted-foreground/60 italic text-sm">No description provided</span>
                    }
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Badge variant="outline" className="bg-muted/30 font-semibold text-foreground border-0">
                      {formatCurrency(item.amount)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {receipts[item.id] && receipts[item.id].length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {receipts[item.id].map((receipt, idx) => renderReceiptButton(receipt, idx))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No receipt
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Subtotal row */}
            {showTotal && (
              <TableRow className="font-bold bg-muted/20">
                <TableCell colSpan={2} className="text-right">Subtotal</TableCell>
                <TableCell className="text-right text-primary font-bold">
                  {formatCurrency(totalAmount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
            
            {/* Previous outstanding advance row */}
            {showCombinedTotal && previousOutstandingAdvance > 0 && (
              <TableRow className="font-bold bg-amber-50/50">
                <TableCell colSpan={2} className="text-right text-amber-800">
                  Previous Outstanding Advance
                </TableCell>
                <TableCell className="text-right text-amber-800 font-bold">
                  {formatCurrency(previousOutstandingAdvance)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
            
            {/* Combined total row */}
            {showCombinedTotal && previousOutstandingAdvance > 0 && (
              <TableRow className="font-bold bg-primary/10">
                <TableCell colSpan={2} className="text-right">Total Amount</TableCell>
                <TableCell className="text-right text-primary font-bold">
                  {formatCurrency(calculateCombinedTotal())}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExpensesTable;