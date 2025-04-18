'use client';

import { useState } from 'react';
import { ExpenseCategory } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DollarSign, PaperclipIcon, CheckCircle2, Trash2, Plus, Receipt } from "lucide-react";

// Expense item type
export interface ExpenseItemFormData {
  category: string;
  amount: number;
  description?: string;
}

interface SharedExpenseSectionProps {
  form?: any; // Optional form control for previous outstanding advance
  expenseItems: ExpenseItemFormData[];
  addExpenseItem: () => void;
  removeExpenseItem: (index: number) => void;
  handleExpenseChange: (index: number, field: keyof ExpenseItemFormData, value: any) => void;
  handleFileChange: (category: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: Record<string, File | null>;
  calculateTotalAmount: () => number;
  categoryOptions: Array<{ value: string; label: string }>;
  showPreviousAdvance?: boolean;
  readOnly?: boolean;
}

const SharedExpenseSection: React.FC<SharedExpenseSectionProps> = ({
  form,
  expenseItems,
  addExpenseItem,
  removeExpenseItem,
  handleExpenseChange,
  handleFileChange,
  selectedFiles,
  calculateTotalAmount,
  categoryOptions,
  showPreviousAdvance = false,
  readOnly = false
}) => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Receipt className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium">Expenses</h3>
        </div>
        
        {!readOnly && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addExpenseItem}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>
      
      {showPreviousAdvance && form && (
        <div className="p-4 border rounded-md bg-muted/10 mb-4">
          <FormField
            control={form.control}
            name="previousOutstandingAdvance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  Previous Outstanding Advance (if any)
                </FormLabel>
                <FormControl>
                  <div className="flex items-center max-w-xs">
                    <span className="px-3 py-2 bg-muted border-y border-l rounded-l-md text-muted-foreground">Nrs.</span>
                    <Input
                      type="number"
                      {...field}
                      className="rounded-l-none"
                      min="0"
                      readOnly={readOnly}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      
      <div className="rounded-md border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Receipts</TableHead>
              {!readOnly && <TableHead className="w-[80px] text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseItems.map((item, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                <TableCell>
                  {readOnly ? (
                    <span>{categoryOptions.find(option => option.value === item.category)?.label || item.category}</span>
                  ) : (
                    <Select
                      value={item.category}
                      onValueChange={(value) => handleExpenseChange(index, 'category', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="px-2 py-2 bg-muted border-y border-l rounded-l-md text-muted-foreground text-xs">Nrs.</span>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="max-w-24 rounded-l-none"
                      min="0"
                      step="0.01"
                      readOnly={readOnly}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                    placeholder="Brief description"
                    readOnly={readOnly}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <label
                        htmlFor={`receipt-${index}`}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 px-2 py-1 border rounded-md hover:bg-accent text-sm">
                          <PaperclipIcon className="h-4 w-4" />
                          <span>Upload</span>
                        </div>
                      </label>
                    )}
                    <input
                      id={`receipt-${index}`}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(`${item.category}-${index}`, e)}
                      className="hidden"
                      disabled={readOnly}
                    />
                    {selectedFiles[`${item.category}-${index}`] && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[6rem] text-xs">
                          {selectedFiles[`${item.category}-${index}`]?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                {!readOnly && (
                  <TableCell className="text-center">
                    {expenseItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExpenseItem(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow className="font-medium bg-muted/20">
              <TableCell colSpan={1} className="text-right">Total Amount</TableCell>
              <TableCell>
                <div className="flex items-center font-bold">
                  <span className="mr-1">Nrs.</span>
                  <span>{calculateTotalAmount().toFixed(2)}</span>
                </div>
              </TableCell>
              <TableCell colSpan={readOnly ? 2 : 3}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SharedExpenseSection;