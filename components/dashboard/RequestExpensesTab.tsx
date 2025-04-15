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
  Users, 
  Check
} from 'lucide-react';

interface RequestExpensesTabProps {
  expenseItems: ExpenseItem[];
  receipts: Record<string, Receipt[]>;
  totalAmount: number;
}

export default function RequestExpensesTab({ 
  expenseItems, 
  receipts, 
  totalAmount 
}: RequestExpensesTabProps) {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            Expense Details
          </CardTitle>
          <CardDescription>
            Review all expense items and attached receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenseItems.length === 0 ? (
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No expense items found for this request.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                    <TableCell className="font-medium">
                      Nrs.{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </TableCell>
                    <TableCell>
                      {receipts[item.id] && receipts[item.id].length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {receipts[item.id].map((receipt) => (
                            <TooltipProvider key={receipt.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-1 h-auto p-1 w-fit"
                                    asChild
                                  >
                                    <a
                                      href={`/uploads/${receipt.storedFilename}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80 text-sm"
                                    >
                                      <Paperclip size={14} />
                                      <span className="truncate max-w-[150px]">{receipt.originalFilename}</span>
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to view receipt</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">
                          No receipts
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/20">
                  <TableCell colSpan={2} className="text-right">Total</TableCell>
                  <TableCell className="text-primary font-bold">
                    Nrs.{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" />
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
                <span>View All Attachments</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
              >
                <Users size={16} className="text-primary" />
                <span>View Employee History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Approval Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-primary" />
                </div>
                <span>Verify that all expense items align with the company travel policy.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-primary" />
                </div>
                <span>Check that appropriate receipts are attached for all relevant expenses.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-primary" />
                </div>
                <span>Confirm that the travel dates and purpose are valid for the employee's role.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-primary" />
                </div>
                <span>Review any previous outstanding advances before approving new requests.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}