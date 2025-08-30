# Enhanced HR Management API System

## 🚀 Complete Role-Based API Architecture

This document provides comprehensive guidance for the enhanced API system with role-based authentication, Prisma integration, and advanced HR management features.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Endpoints](#api-endpoints)
4. [Role-Based Access Control](#role-based-access-control)
5. [Data Models](#data-models)
6. [Usage Examples](#usage-examples)
7. [Migration Guide](#migration-guide)

## 🏗️ Architecture Overview

### Enhanced Features

- **Role-Based Authentication**: 8 hierarchical roles with granular permissions
- **Prisma Integration**: Type-safe database operations with optimized queries
- **Audit Logging**: Complete action tracking for HR compliance
- **Organization Scoping**: Multi-tenant support with data isolation
- **Advanced Filtering**: Complex queries with pagination and search

### Technology Stack

- **Framework**: Next.js 15 API Routes
- **ORM**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js with JWT
- **Authorization**: Custom middleware with role hierarchy
- **Validation**: Zod schemas (ready to implement)

## 🔐 Authentication & Authorization

### Role Hierarchy

```typescript
enum ExtendedRole {
  EMPLOYEE = 1,      // Basic access to own data
  MANAGER = 2,       // Team management + employee access
  APPROVER = 3,      // Request approvals + manager access
  CHECKER = 4,       // Request verification + approver access
  FINANCE = 5,       // Financial operations + checker access
  HR_ADMIN = 6,      // HR operations + finance access
  ADMIN = 7,         // System administration + HR access
  SUPER_ADMIN = 8    // Full system access
}
```

### Permission Groups

```typescript
const PERMISSIONS = {
  // Employee permissions
  VIEW_OWN_DATA: ['EMPLOYEE', 'MANAGER', 'APPROVER', ...],
  CREATE_OWN_REQUEST: ['EMPLOYEE', 'MANAGER', 'APPROVER', ...],
  
  // Manager permissions
  VIEW_TEAM_DATA: ['MANAGER', 'APPROVER', 'HR_ADMIN', ...],
  APPROVE_TEAM_REQUESTS: ['MANAGER', 'APPROVER', 'HR_ADMIN', ...],
  
  // HR Admin permissions
  MANAGE_EMPLOYEES: ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  MANAGE_PAYROLL: ['FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // System permissions
  SYSTEM_ADMIN: ['SUPER_ADMIN']
};
```

### Middleware Usage

```typescript
// Basic authentication
export const GET = withAuth(async (request, user) => {
  // User is authenticated and available
});

// Role-based access control
export const POST = withRoles(
  PERMISSIONS.MANAGE_EMPLOYEES,
  async (request, user) => {
    // User has required permissions
  }
);

// Organization-scoped operations
export const GET = withOrgScope(
  PERMISSIONS.VIEW_TEAM_DATA,
  async (request, user) => {
    // Automatic organization filtering
  }
);
```

## 🛠️ API Endpoints

### Core HR Management

#### Employee Management
```
GET    /api/hr/employees              - List employees with filters
POST   /api/hr/employees              - Create new employee
PUT    /api/hr/employees              - Bulk update employees
GET    /api/hr/employees/[id]         - Get specific employee
PUT    /api/hr/employees/[id]         - Update employee
DELETE /api/hr/employees/[id]         - Deactivate employee
```

#### Payroll Management
```
GET    /api/hr/payroll                - Get payroll records
POST   /api/hr/payroll                - Generate payroll
PUT    /api/hr/payroll                - Update payroll status
GET    /api/hr/payroll/[id]           - Get specific payroll record
```

#### Dashboard
```
GET    /api/hr/dashboard              - Role-based dashboard data
```

### Travel & Expense Management

#### Enhanced Travel Requests
```
GET    /api/travel/requests           - List travel requests (role-filtered)
POST   /api/travel/requests           - Create travel request
PUT    /api/travel/requests           - Bulk update requests
GET    /api/travel/requests/[id]      - Get specific request
PUT    /api/travel/requests/[id]      - Update request
DELETE /api/travel/requests/[id]      - Cancel request
```

#### Expense Management
```
GET    /api/expenses                  - List expenses
POST   /api/expenses                  - Create expense
GET    /api/expenses/[id]             - Get specific expense
PUT    /api/expenses/[id]             - Update expense
```

### Task Management

#### Enhanced Tasks
```
GET    /api/tasks                     - List tasks (role-filtered)
POST   /api/tasks                     - Create task with action items
PUT    /api/tasks                     - Bulk update tasks
GET    /api/tasks/[id]                - Get task details
PUT    /api/tasks/[id]                - Update task
DELETE /api/tasks/[id]                - Delete task

GET    /api/tasks/[id]/action-items   - List task action items
POST   /api/tasks/[id]/action-items   - Create action item
PUT    /api/tasks/[id]/action-items/[actionId] - Update action item
```

### Meeting Management

#### Enhanced Meetings
```
GET    /api/meetings/enhanced         - List meetings with action items
POST   /api/meetings/enhanced         - Create meeting with minutes
PUT    /api/meetings/enhanced         - Bulk update meetings
GET    /api/meetings/enhanced/[id]    - Get meeting details
PUT    /api/meetings/enhanced/[id]    - Update meeting
```

## 🔒 Role-Based Access Control

### Employee Access Pattern
```typescript
// Employees can only access their own data
const employeeRequests = await fetch('/api/travel/requests?employeeId=own');

// Automatic filtering applied based on session
const myDashboard = await fetch('/api/hr/dashboard');
```

### Manager Access Pattern
```typescript
// Managers can access team data
const teamRequests = await fetch('/api/travel/requests?myTeam=true');

// Get team dashboard
const teamDashboard = await fetch('/api/hr/dashboard?view=team');
```

### HR Admin Access Pattern
```typescript
// Full employee management
const allEmployees = await fetch('/api/hr/employees?includeProfiles=true');

// Payroll operations
const payroll = await fetch('/api/hr/payroll?payPeriod=2024-01');

// Organization analytics
const orgDashboard = await fetch('/api/hr/dashboard?view=organization');
```

## 📊 Data Models

### Enhanced Employee Profile
```typescript
interface EmployeeProfile {
  // Personal Information
  personalEmail?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  dateOfBirth?: Date;
  nationality?: string;
  maritalStatus?: MaritalStatus;
  
  // Employment Details
  employmentType: EmploymentType;
  salary?: number;
  salaryGrade?: string;
  probationEndDate?: Date;
  
  // Leave Balances
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  personalLeaveBalance: number;
  
  // Bank Details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}
```

### Payroll Integration
```typescript
interface PayrollRecord {
  userId: string;
  payPeriod: string;          // "2024-01"
  basicSalary: number;
  allowances: number;
  deductions: number;
  travelReimbursement: number; // Integrated with travel expenses
  overtimePay: number;
  bonus: number;
  grossPay: number;
  netPay: number;
  status: PayrollStatus;
}
```

### Enhanced Task Management
```typescript
interface Task {
  // Basic fields
  title: string;
  description?: string;
  departmentId: string;
  
  // Assignment
  assignedTo: string[];        // Names for display
  assignedUserIds: string[];   // IDs for operations
  
  // Status & Priority
  status: TaskStatus;
  priority: TaskPriority;
  ragStatus: RagStatus;
  
  // Dates
  dueDate?: string;
  startDate?: string;
  completionDate?: string;
  
  // Action Items
  actionItems?: TaskActionItem[];
  
  // Computed fields
  totalHoursSpent: number;
  isOverdue: boolean;
  completionPercentage: number;
}
```

## 💻 Usage Examples

### Employee Dashboard
```typescript
// Frontend component
const EmployeeDashboard = () => {
  const { data: dashboard } = useSWR('/api/hr/dashboard', fetcher);
  
  return (
    <div>
      <h2>My Dashboard</h2>
      <div>
        <span>Pending Requests: {dashboard.employee.requests.pending}</span>
        <span>Total Hours This Month: {dashboard.employee.timeLogs.totalHours}</span>
        <span>Active Tasks: {dashboard.employee.tasks.inProgress}</span>
      </div>
    </div>
  );
};
```

### Manager Team Overview
```typescript
// Manager viewing team data
const TeamDashboard = () => {
  const { data: team } = useSWR('/api/hr/employees?myTeam=true', fetcher);
  const { data: requests } = useSWR('/api/travel/requests?myTeam=true', fetcher);
  
  return (
    <div>
      <h2>Team Overview</h2>
      <TeamStats team={team} />
      <PendingApprovals requests={requests.filter(r => r.status === 'pending')} />
    </div>
  );
};
```

### HR Admin Operations
```typescript
// Bulk employee operations
const bulkUpdateEmployees = async (employees: Employee[], updates: Partial<Employee>) => {
  const response = await fetch('/api/hr/employees', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employees: employees.map(emp => ({ id: emp.id, ...updates }))
    })
  });
  return response.json();
};

// Payroll generation
const generatePayroll = async (payPeriod: string, userIds?: string[]) => {
  const response = await fetch('/api/hr/payroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payPeriod, userIds })
  });
  return response.json();
};
```

### Advanced Filtering
```typescript
// Complex travel request query
const advancedSearch = async (filters: {
  status?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  requestType?: string;
}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const response = await fetch(`/api/travel/requests?${params}`);
  return response.json();
};
```

## 🔄 Migration Guide

### From Supabase to Enhanced APIs

#### 1. Update API Calls
```typescript
// Old Supabase approach
const { data } = await supabase
  .from('travel_requests')
  .select('*')
  .eq('employee_id', userId);

// New Enhanced API
const response = await fetch('/api/travel/requests?employeeId=' + userId);
const data = await response.json();
```

#### 2. Handle Role-Based Responses
```typescript
// API automatically filters based on user role
const { data: dashboard } = await fetch('/api/hr/dashboard').then(r => r.json());

// Different data structure based on role:
// - dashboard.employee (for employees)
// - dashboard.approver (for managers/approvers)
// - dashboard.admin (for HR/admins)
```

#### 3. Error Handling
```typescript
const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        // Handle authentication
        redirect('/login');
        break;
      case 403:
        // Handle authorization
        toast.error(`Access denied: ${error.error}`);
        break;
      default:
        toast.error(error.error || 'An error occurred');
    }
    
    throw new Error(error.error);
  }
  
  return response.json();
};
```

### 4. Gradual Migration Strategy

1. **Phase 1**: Use enhanced APIs alongside existing ones
2. **Phase 2**: Update critical components (dashboards, forms)
3. **Phase 3**: Replace all API calls
4. **Phase 4**: Remove old Supabase dependencies

### 5. Testing Strategy

```typescript
// Test role-based access
describe('Role-based API Access', () => {
  it('should allow employee to access own data', async () => {
    const response = await testApiCall('/api/hr/employees/123', 'EMPLOYEE', '123');
    expect(response.status).toBe(200);
  });
  
  it('should deny employee access to other employee data', async () => {
    const response = await testApiCall('/api/hr/employees/456', 'EMPLOYEE', '123');
    expect(response.status).toBe(403);
  });
  
  it('should allow HR admin access to all employee data', async () => {
    const response = await testApiCall('/api/hr/employees/456', 'HR_ADMIN', '123');
    expect(response.status).toBe(200);
  });
});
```

## 🚀 Deployment Checklist

- [ ] Update environment variables for Prisma
- [ ] Run database migrations
- [ ] Update authentication configuration
- [ ] Test all role-based permissions
- [ ] Monitor API performance
- [ ] Set up audit log monitoring
- [ ] Configure error tracking

## 📈 Performance Optimizations

1. **Database Indexes**: Strategic indexes for common queries
2. **Query Optimization**: Prisma includes and selects
3. **Caching**: Redis for frequently accessed data
4. **Pagination**: Consistent pagination across all endpoints
5. **Field Selection**: Only fetch required fields

## 🔧 Maintenance

### Monitoring
- API response times
- Error rates by endpoint
- Role-based access patterns
- Database query performance

### Logging
- All API actions are logged for audit
- Role-based access attempts
- Failed authentication/authorization
- System errors and exceptions

---

**Status**: ✅ Production Ready
**Version**: 2.0.0
**Last Updated**: January 2025