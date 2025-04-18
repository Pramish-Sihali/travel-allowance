import { useState } from 'react';
import { ExpenseItem, Receipt } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  DollarSign, 
  FileText, 
  Paperclip, 
  Download, 
  Eye, 
  Check,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Image
} from 'lucide-react';

interface RequestExpensesTabProps {
  expenseItems: ExpenseItem[];
  receipts: Record<string, Receipt[]>;
  totalAmount: number;
  previousOutstandingAdvance?: number;
}

export default function RequestExpensesTab({ 
  expenseItems, 
  receipts, 
  totalAmount,
  previousOutstandingAdvance = 0
}: RequestExpensesTabProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accommodation':
        return <BuildingIcon className="h-4 w-4 text-blue-600" />;
      case 'per-diem':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'vehicle-hiring':
        return <CarIcon className="h-4 w-4 text-orange-600" />;
      case 'food':
        return <CoffeeIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    return totalAmount + previousOutstandingAdvance;
  };

  // Check if a file is an image
  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };
  
  // Custom icons for categories
  const BuildingIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
  
  const CarIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
  
  const CoffeeIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );

  return (
    <div className="p-6">
      {expenseItems.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-md">
          <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No expense items found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (Nrs.)</TableHead>
                  <TableHead>Receipts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span>{formatCategoryName(item.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell className="text-right">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell>
                      {receipts[item.id] && receipts[item.id].length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {receipts[item.id].map((receipt) => (
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
                                    {receipt.originalFilename}
                                  </span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Receipt: {receipt.originalFilename}</DialogTitle>
                                  <DialogDescription>
                                    {receipt.uploadDate && `Uploaded on ${new Date(receipt.uploadDate).toLocaleString()}`}
                                  </DialogDescription>
                                </DialogHeader>
                                
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
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No receipt
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-medium">
                  <TableCell colSpan={2} className="text-right">Total</TableCell>
                  <TableCell className="text-right">
                    {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                
                {previousOutstandingAdvance > 0 && (
                  <TableRow className="font-bold bg-amber-50/50">
                    <TableCell colSpan={2} className="text-right text-amber-800">
                      Previous Outstanding Advance
                    </TableCell>
                    <TableCell className="text-right text-amber-800 font-bold">
                      {previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
                
                {previousOutstandingAdvance > 0 && (
                  <TableRow className="font-bold bg-primary/10">
                    <TableCell colSpan={2} className="text-right">Total Amount</TableCell>
                    <TableCell className="text-right text-primary font-bold">
                      {calculateCombinedTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-muted/10 p-4 rounded-md border">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Receipt Verification
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {expenseItems.every(item => 
                    receipts[item.id] && receipts[item.id].length > 0
                  ) ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Receipt Status</p>
                  <p className="text-sm text-muted-foreground">
                    {expenseItems.every(item => 
                      receipts[item.id] && receipts[item.id].length > 0
                    ) ? (
                      "All expense items have receipts attached"
                    ) : (
                      "Some expense items are missing receipts"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {expenseItems.every(item => item.description && item.description.trim() !== '') ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Description Completeness</p>
                  <p className="text-sm text-muted-foreground">
                    {expenseItems.every(item => item.description && item.description.trim() !== '') ? (
                      "All expense items have descriptions"
                    ) : (
                      "Some expense items are missing descriptions"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}