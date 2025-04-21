'use client';

import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Users } from "lucide-react";

// Define approver type
interface ApproverOption {
  value: string;
  label: string;
  email?: string;
}

// ApproverSelectionSection Component
const ApproverSelectionSection = ({ 
  form, 
  approverOptions, 
  loadingApprovers,
  readOnly = false 
}: { 
  form: any, 
  approverOptions: ApproverOption[], 
  loadingApprovers: boolean,
  readOnly?: boolean
}) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <Users className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Approver Selection</h3>
    </div>
    
    <FormField
      control={form.control}
      name="approverId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Select Approver</FormLabel>
          {readOnly ? (
            <Input {...field} readOnly className="bg-muted/30" value={
              approverOptions.find(a => a.value === field.value)?.label || field.value
            } />
          ) : (
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={loadingApprovers || readOnly}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={loadingApprovers ? "Loading approvers..." : "Select an approver"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {approverOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.email && <span className="text-xs text-muted-foreground">{option.email}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormDescription>
            This person will review and approve your travel request
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

export default ApproverSelectionSection;