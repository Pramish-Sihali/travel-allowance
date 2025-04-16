import { ExpenseItem, Receipt } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DollarSign, 
  FileText, 
  Paperclip, 
  Download, 
  Eye, 
  Check,
  FileCheck,
  FilePenLine,
  Receipt as ReceiptIcon,
  AlertTriangle,
  Building,
  Calendar
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
  // Helper function to get category-specific icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accommodation':
        return <BuildingIcon className="h-4 w-4 text-blue-600" />;
      case 'per-diem':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'vehicle-hiring':
        return <CarIcon className="h-4 w-4 text-orange-600" />;
      case 'program-cost':
        return <CalendarIcon className="h-4 w-4 text-purple-600" />;
      case 'meeting-cost':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    return totalAmount + previousOutstandingAdvance;
  };
  
  // Render icons for categories
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
  
  const CalendarIcon = ({ className }: { className?: string }) => (
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
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
  
  const Users = ({ className }: { className?: string }) => (
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  
  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <ReceiptIcon size={16} className="text-primary" />
              Expense Details
            </CardTitle>
            <div className="flex flex-col items-end">
              <Badge className="mb-1 bg-primary/10 text-primary border-0 font-bold">
                Request Total: Nrs.{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Badge>
              {previousOutstandingAdvance > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-0 font-bold text-xs">
                  <AlertTriangle size={10} className="mr-1" />
                  Previous Balance: Nrs.{previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            All expense items and attached receipts
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {expenseItems.length === 0 ? (
            <div className="bg-muted/10 p-10 rounded-lg text-center border border-dashed">
              <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No expense items found for this request.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Receipts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseItems.map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize">
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.description || 
                          <span className="text-muted-foreground/60 italic text-sm">No purpose specified</span>
                        }
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="bg-muted/30 font-semibold text-foreground border-0">
                          Nrs.{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {receipts[item.id] && receipts[item.id].length > 0 ? (
                          <div className="flex items-center gap-2">
                            {receipts[item.id].map((receipt) => (
                              <TooltipProvider key={receipt.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 flex items-center gap-1 text-primary"
                                      asChild
                                    >
                                      <a
                                        href={`/uploads/${receipt.storedFilename}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Paperclip size={14} />
                                        <span className="truncate max-w-[150px] text-xs">
                                          {receipt.originalFilename}
                                        </span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <div className="text-xs">
                                      <p className="font-medium">{receipt.originalFilename}</p>
                                      <p className="text-muted-foreground">
                                        Click to view receipt
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                  <TableRow className="font-bold bg-muted/30">
                    <TableCell colSpan={2} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-primary font-bold">
                      Nrs.{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  
                  {previousOutstandingAdvance > 0 && (
                    <TableRow className="font-bold bg-amber-50/50">
                      <TableCell colSpan={2} className="text-right text-amber-800">
                        Previous Outstanding Advance
                      </TableCell>
                      <TableCell className="text-amber-800 font-bold">
                        Nrs.{previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  
                  {previousOutstandingAdvance > 0 && (
                    <TableRow className="font-bold bg-primary/10">
                      <TableCell colSpan={2} className="text-right">Total Amount</TableCell>
                      <TableCell className="text-primary font-bold">
                        Nrs.{calculateCombinedTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck size={16} className="text-primary" />
              Document Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-muted/10 rounded-md">
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
                  <p className="font-medium">Receipt Verification</p>
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
              
              <div className="flex items-start gap-2 p-3 bg-muted/10 rounded-md">
                <div className="mt-0.5">
                  {expenseItems.every(item => item.description && item.description.trim() !== '') ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Purpose Completeness</p>
                  <p className="text-sm text-muted-foreground">
                    {expenseItems.every(item => item.description && item.description.trim() !== '') ? (
                      "All expense items have purpose descriptions"
                    ) : (
                      "Some expense items are missing purpose descriptions"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-muted/10 rounded-md">
                <div className="mt-0.5">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Expense Categories</p>
                  <p className="text-sm text-muted-foreground">
                    All expense categories are valid and appropriate
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <FilePenLine size={16} className="text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <Button
                variant="ghost"
                className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
              >
                <Download size={16} className="text-primary" />
                <span>Download All Receipts</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
              >
                <Eye size={16} className="text-primary" />
                <span>View Expense Summary</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
              >
                <FileText size={16} className="text-primary" />
                <span>Export as PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}