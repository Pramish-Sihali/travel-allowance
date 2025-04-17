// components/dashboard/data/iconMappings.ts
import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  FileText, 
  Briefcase,
  Building,
  CheckCircle,
  MapPin,
  Plane,
  CreditCard,
  AlertTriangle,
  User,
  Receipt,
  Coffee,
  FileCheck,
  CheckCheck,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Check,
  FilePenLine,
  ArrowLeft,
  Download,
  CheckCircle2,
  ScrollText,
  ClipboardCheck,
  Info, 
  LucideIcon
} from 'lucide-react';

// Special Vehicle icon - we'll use the Building icon as a fallback in TS
// In actual usage, you'll need to import a specific car icon from 'lucide-react'
// or another icon library
export const Car: LucideIcon = Building;

// Category icons
export const getCategoryIcon = (category: string): LucideIcon => {
  switch (category) {
    case 'accommodation':
      return Building;
    case 'per-diem':
      return DollarSign;
    case 'vehicle-hiring':
    case 'taxi':
    case 'ride-share':
      return Car;
    case 'program-cost':
      return Calendar;
    case 'meeting-cost':
      return Users;
    case 'food':
    case 'meals':
      return Coffee;
    case 'transportation':
      return Plane;
    case 'miscellaneous':
    case 'other':
      return FileText;
    default:
      return Receipt;
  }
};

// Status icons
export const getStatusIcon = (status: string): LucideIcon => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'pending_verification':
      return Info;
    case 'approved':
      return CheckCircle;
    case 'rejected':
    case 'rejected_by_checker':
      return AlertTriangle;
    default:
      return Info;
  }
};

// Tab icons mapping
export const tabIconsMap: Record<string, LucideIcon> = {
  details: FileText,
  expenses: DollarSign,
  approval: CheckCircle,
  verification: CheckCircle2,
  current: Clock,
  past: Calendar,
  pending: Clock,
  completed: FileText,
  projects: Briefcase
};

// Action icons mapping
export const actionIconsMap: Record<string, LucideIcon> = {
  approve: ThumbsUp,
  reject: ThumbsDown,
  verify: FileCheck,
  back: ArrowLeft,
  download: Download,
  comment: MessageCircle
};

// Panel section icons
export const panelIconsMap: Record<string, LucideIcon> = {
  approvalProcess: CheckCheck,
  approvalChecklist: ClipboardCheck,
  policyReminders: ScrollText,
  documentCheck: FileCheck,
  quickActions: FilePenLine,
  userInfo: User,
  expenseDetails: Receipt
};