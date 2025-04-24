'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { 
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle
} from "lucide-react";

// Import constants
import { 
  purposeOptions, 
  locationOptions, 
  transportModeOptions,
  yesNoOptions,
} from "./constants";

// Define project type
interface ProjectOption {
  value: string;
  label: string;
}

// Define TravelDetailsSection Component
const TravelDetailsSection = ({ 
  form, 
  projectOptions, 
  loadingProjects,
  readOnly = false
}: { 
  form: any, 
  projectOptions: ProjectOption[], 
  loadingProjects: boolean,
  readOnly?: boolean
}) => {
  // Check if the request type is 'advance' or 'emergency' to conditionally show the specialized fields
  const isAdvanceRequest = form.watch('requestType') === 'advance';
  const isEmergencyRequest = form.watch('requestType') === 'emergency';
  
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Travel Details</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-4 border rounded-md bg-muted/10">
            <h4 className="text-sm font-medium mb-4 text-muted-foreground">Project & Purpose Information</h4>
            
            <div className="space-y-4">
              {/* Project selection */}
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        projectOptions.find(p => p.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loadingProjects || readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select project"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!readOnly && form.watch('project') === 'other' && (
                <FormField
                  control={form.control}
                  name="projectOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Project</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter project name" readOnly={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Purpose of travel */}
              <FormField
                control={form.control}
                name="purposeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Travel</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        purposeOptions.find(p => p.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {purposeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!readOnly && form.watch('purposeType') === 'other' && (
                <FormField
                  control={form.control}
                  name="purposeOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Purpose</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter purpose" readOnly={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        locationOptions.find(l => l.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locationOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!readOnly && form.watch('location') === 'other' && (
                <FormField
                  control={form.control}
                  name="locationOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter location" readOnly={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
          
          {/* Advance Request Estimation Section */}
          {isAdvanceRequest && (
            <div className="p-4 border border-amber-200 rounded-md bg-amber-50">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <h4 className="text-sm font-medium text-amber-700">Advance Request Information</h4>
              </div>
              
              <FormField
                control={form.control}
                name="estimatedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-amber-600" />
                      <span>Estimated Amount</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-amber-100 border-y border-l border-amber-200 rounded-l-md text-amber-700">Nrs.</span>
                        <Input
                          type="number"
                          {...field}
                          className="rounded-l-none border-amber-200"
                          placeholder="Enter estimated amount"
                          readOnly={readOnly}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-amber-700">
                      This is the estimated amount you're requesting as an advance.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="advanceNotes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Advance Request Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Provide details about your advance request including why you need the funds in advance and your expense estimation breakdown."
                        className="resize-none min-h-[80px] border-amber-200"
                        readOnly={readOnly}
                      />
                    </FormControl>
                    <FormDescription className="text-amber-700">
                      The approver will review this information when considering your advance request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Emergency Request Information Section */}
          {isEmergencyRequest && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="text-sm font-medium text-red-700">Emergency Request Information</h4>
              </div>
              
              {/* Emergency Amount Field */}
              <FormField
                control={form.control}
                name="emergencyAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-red-600" />
                      <span>Estimated Amount</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-red-100 border-y border-l border-red-200 rounded-l-md text-red-700">Nrs.</span>
                        <Input
                          type="number"
                          {...field}
                          className="rounded-l-none border-red-200"
                          placeholder="Enter estimated amount for emergency"
                          readOnly={readOnly}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-red-700">
                      This is the estimated amount needed for your emergency request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergencyReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Reason</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-red-200">
                          <SelectValue placeholder="Select emergency reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent-meeting">Urgent Meeting</SelectItem>
                          <SelectItem value="crisis-response">Crisis Response</SelectItem>
                          <SelectItem value="time-sensitive">Time-Sensitive Opportunity</SelectItem>
                          <SelectItem value="medical">Medical Emergency</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription className="text-red-700">
                      Select the reason why this travel request is an emergency.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('emergencyReason') === 'other' && (
                <FormField
                  control={form.control}
                  name="emergencyReasonOther"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Specify Emergency Reason</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Specify the emergency reason"
                          className="border-red-200"
                          readOnly={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="emergencyJustification"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Emergency Justification</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Please provide a detailed explanation of why this travel requires emergency processing. Include any relevant deadlines or consequences of delay."
                        className="resize-none min-h-[80px] border-red-200"
                        readOnly={readOnly}
                      />
                    </FormControl>
                    <FormDescription className="text-red-700">
                      The approver will review this justification when considering your emergency request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="p-4 border rounded-md bg-muted/10">
            <h4 className="text-sm font-medium mb-4 text-muted-foreground">Travel Schedule & Transport</h4>
            
            <div className="space-y-4">
              {/* Travel Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="travelDateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>From Date</span>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          readOnly={readOnly}
                          className={readOnly ? "bg-muted/30" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="travelDateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>To Date</span>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          readOnly={readOnly}
                          className={readOnly ? "bg-muted/30" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Mode of Transport */}
              <FormField
                control={form.control}
                name="transportMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Transport</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        transportModeOptions.find(t => t.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transportModeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Transport Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station/Pick/Drop */}
                <FormField
                  control={form.control}
                  name="stationPickDrop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station/Pick/Drop</FormLabel>
                      {readOnly ? (
                        <Input {...field} readOnly className="bg-muted/30" value={
                          yesNoOptions.find(o => o.value === field.value)?.label || field.value
                        } />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yesNoOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Local Conveyance */}
                <FormField
                  control={form.control}
                  name="localConveyance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Conveyance</FormLabel>
                      {readOnly ? (
                        <Input {...field} readOnly className="bg-muted/30" value={
                          yesNoOptions.find(o => o.value === field.value)?.label || field.value
                        } />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yesNoOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Checkboxes */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <FormField
                  control={form.control}
                  name="rideShareUsed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ride Share Used</FormLabel>
                        <FormDescription>
                          Check if using ride sharing services
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ownVehicleReimbursement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Own Vehicle</FormLabel>
                        <FormDescription>
                          Request reimbursement for personal vehicle
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelDetailsSection;