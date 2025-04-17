// components/forms/valley-constants.tsx
import { Car, Coffee, FileText, Users, ShoppingBag, Utensils } from "lucide-react";

// Purpose options for in-valley reimbursements
export const valleyPurposeOptions = [
  { value: "meeting", label: "Business Meeting", icon: <Users className="h-4 w-4" /> },
  { value: "office-supplies", label: "Office Supplies", icon: <ShoppingBag className="h-4 w-4" /> },
  { value: "lunch", label: "Lunch/Dinner with Clients", icon: <Utensils className="h-4 w-4" /> },
  { value: "local-transport", label: "Local Transportation", icon: <Car className="h-4 w-4" /> },
  { value: "refreshments", label: "Team Refreshments", icon: <Coffee className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <FileText className="h-4 w-4" /> },
];

// Expense category options for in-valley
export const valleyExpenseCategoryOptions = [
  { value: "ride-share", label: "Ride Share Service" },
  { value: "taxi", label: "Taxi" },
  { value: "food", label: "Food & Beverages" },
  { value: "meeting-venue", label: "Meeting Venue" },
  { value: "stationery", label: "Stationery & Supplies" },
  { value: "printing", label: "Printing & Photocopying" },
  { value: "courier", label: "Courier & Postage" },
  { value: "other", label: "Other" },
];

// Meeting types for in-valley reimbursements
export const meetingTypeOptions = [
  { value: "internal", label: "Internal Team Meeting" },
  { value: "client", label: "Client Meeting" },
  { value: "vendor", label: "Vendor Meeting" },
  { value: "interview", label: "Interview" },
  { value: "other", label: "Other" },
];

// Payment methods
export const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "personal-card", label: "Personal Credit/Debit Card" },
  { value: "company-card", label: "Company Card" },
  { value: "digital-wallet", label: "Digital Wallet" },
  { value: "other", label: "Other" },
];