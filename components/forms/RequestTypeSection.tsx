'use client';

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Clock,
  FileText, 
  CreditCard, 
  AlertTriangle, 
  UsersRound 
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// RequestTypeSection Component
const RequestTypeSection = ({ form }: { form: any }) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <Clock className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Request Type</h3>
    </div>
    
    <FormField
      control={form.control}
      name="requestType"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2"
            >
              <div>
                <RadioGroupItem
                  value="normal"
                  id="requestType-normal"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-normal"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileText className="h-6 w-6 mb-3 text-blue-500" />
                  <span className="font-medium">Normal Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Standard processing</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="advance"
                  id="requestType-advance"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-advance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="h-6 w-6 mb-3 text-green-500" />
                  <span className="font-medium">Advance Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Get funds before travel</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="emergency"
                  id="requestType-emergency"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-emergency"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <AlertTriangle className="h-6 w-6 mb-3 text-red-500" />
                  <span className="font-medium">Emergency Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Urgent processing</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="group"
                  id="requestType-group"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-group"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <UsersRound className="h-6 w-6 mb-3 text-purple-500" />
                  <span className="font-medium">Group Travel</span>
                  <span className="text-xs text-muted-foreground mt-1">For team travel</span>
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    {/* Group Travel Captain Checkbox - only show when group travel is selected */}
    {form.watch('requestType') === 'group' && (
      <div className="mt-4 p-4 border rounded-md bg-purple-50">
        <FormField
          control={form.control}
          name="isGroupCaptain"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I am the Group Captain</FormLabel>
                <FormDescription>
                  Check this box if you are organizing this group travel
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    )}
  </div>
);

export default RequestTypeSection;