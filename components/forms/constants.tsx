import React from 'react';
import { Plane, Bus, Car, Bike } from "lucide-react";

// Project options
export const projectOptions = [
  { value: "project-a", label: "Project A" },
  { value: "project-b", label: "Project B" },
  { value: "project-c", label: "Project C" },
  { value: "project-d", label: "Project D" },
  { value: "other", label: "Other" },
];

// Purpose options
export const purposeOptions = [
  { value: "site-visit", label: "Site Visit" },
  { value: "workshop", label: "Workshop" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

// Location options
export const locationOptions = [
  { value: "kathmandu", label: "Kathmandu" },
  { value: "pokhara", label: "Pokhara" },
  { value: "chitwan", label: "Chitwan" },
  { value: "bhaktapur", label: "Bhaktapur" },
  { value: "lalitpur", label: "Lalitpur" },
  { value: "other", label: "Other" },
];

// Transport mode options
export const transportModeOptions = [
  { value: "air", label: "Air", icon: <Plane className="h-4 w-4" /> },
  { value: "bus", label: "Bus", icon: <Bus className="h-4 w-4" /> },
  { value: "car", label: "Car", icon: <Car className="h-4 w-4" /> },
  { value: "bike", label: "Bike", icon: <Bike className="h-4 w-4" /> },
];

// Yes/No options
export const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
];

// Expense category options
export const expenseCategoryOptions = [
  { value: "accommodation", label: "Accommodation" },
  { value: "per-diem", label: "Per Diem" },
  { value: "vehicle-hiring", label: "Vehicle Hiring" },
  { value: "program-cost", label: "Program Cost" },
  { value: "meeting-cost", label: "Meeting Cost" },
  { value: "other", label: "Other" },
];