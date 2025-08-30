# HR Management System - Prisma Schema Migration Guide

## 🎯 Schema Overview

This optimized Prisma schema is specifically designed for **HR Management Tools** with focus on:

- **Employee Management** with hierarchical structure
- **Travel & Expense Management** with audit trails
- **Payroll Integration** with detailed records
- **Performance Optimization** with strategic indexes
- **Multi-tenant Support** with organization isolation

## 🚀 Key HR Optimizations Implemented

### 1. **Employee-Centric Design**
```prisma
model User {
  employeeId      String?  @unique    // HR employee ID
  managerId       String?             // Hierarchical management
  joinDate        DateTime?           // HR requirement
  terminationDate DateTime?           // Employee lifecycle
}

model EmployeeProfile {
  // Comprehensive HR data
  employmentType     EmploymentType
  salary            Decimal?
  leaveBalances     // Annual, Sick, Personal leave tracking
  bankDetails       // Payroll integration
}
```

### 2. **High-Performance Indexes**
Strategic indexes for common HR queries:

```prisma
// User lookups (most frequent in HR)
@@index([organizationId, isActive])
@@index([role, organizationId])
@@index([department, organizationId])

// Travel request reporting
@@index([employeeId, createdAt])
@@index([status, phase])
@@index([createdAt(sort: Desc)])
```

### 3. **Payroll Integration**
```prisma
model PayrollRecord {
  // Complete payroll data with travel reimbursements
  travelReimbursement Decimal
  overtime, bonus, deductions
  // Unique constraint for pay periods
  @@unique([userId, payPeriod])
}
```

### 4. **Audit Trail Optimization**
- `uploadedBy` fields for file tracking
- `processedDate` for payroll audit
- Comprehensive timestamp tracking
- Soft deletes with `isActive` flags

## 📊 Database Performance Features

### 1. **Query Optimization**
- **Composite indexes** for multi-column searches
- **Partial indexes** on active records only
- **Covering indexes** for reporting queries

### 2. **Data Types Optimization**
- `@db.VarChar(255)` for predictable string fields
- `@db.Decimal(12,2)` for financial precision
- `Json` fields for flexible HR policies

### 3. **Relationship Efficiency**
- **Cascade deletes** for data consistency
- **SetNull** for preserved historical data
- **Restrict** for critical business relationships

## 🔧 Migration Steps

### 1. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Set your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/hr_system?schema=public"
```

### 2. **Install Dependencies** ✅
```bash
npm install prisma @prisma/client
```

### 3. **Generate Prisma Client** ✅
```bash
npm run db:generate
```

### 4. **Database Migration**
```bash
# Create and apply migration
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

### 5. **Replace Supabase Calls**
Gradually replace your existing Supabase calls with Prisma:

```typescript
// Before (Supabase)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('organization_id', orgId);

// After (Prisma)
const users = await prisma.user.findMany({
  where: { organizationId: orgId },
  include: { employeeProfile: true }
});
```

## 📈 HR-Specific Query Examples

### 1. **Employee Hierarchy**
```typescript
// Get manager's team with profiles
const team = await prisma.user.findMany({
  where: { 
    managerId: managerId,
    isActive: true 
  },
  include: {
    employeeProfile: true,
    travelRequests: {
      where: { 
        createdAt: { gte: startOfMonth } 
      }
    }
  }
});
```

### 2. **Payroll Report**
```typescript
// Monthly payroll with travel expenses
const payroll = await prisma.payrollRecord.findMany({
  where: {
    organizationId: orgId,
    payPeriod: '2024-01'
  },
  include: {
    user: {
      include: { employeeProfile: true }
    }
  }
});
```

### 3. **Travel Analytics**
```typescript
// Department travel spending
const analytics = await prisma.travelRequest.groupBy({
  by: ['department'],
  where: {
    organizationId: orgId,
    status: 'approved'
  },
  _sum: { totalAmount: true },
  _count: true
});
```

## 🎯 HR Business Logic Benefits

### 1. **Leave Management**
- Automatic leave balance tracking
- Integration with attendance records
- Manager approval workflows

### 2. **Expense Management**
- Travel expense integration with payroll
- Receipt management with audit trails
- Multi-level approval workflows

### 3. **Performance Tracking**
- Task management integration
- Time log tracking
- Meeting and follow-up management

### 4. **Reporting & Analytics**
- Optimized indexes for HR reports
- Date-range queries for compliance
- Department and employee analytics

## 🔒 Security & Compliance

### 1. **Data Protection**
- Organization-level data isolation
- Soft deletes for audit requirements
- Encrypted sensitive fields support

### 2. **Access Control**
- Role-based permissions
- Manager-subordinate relationships
- Audit trail preservation

## 🚨 Important Notes

1. **Migration Planning**: Test the migration in development first
2. **Data Backup**: Always backup before running migrations
3. **Index Monitoring**: Monitor query performance after deployment
4. **Gradual Rollout**: Replace Supabase calls incrementally

## 📱 Next Steps

1. Run `npm run db:migrate` to create your database
2. Update your API routes to use Prisma client
3. Implement HR-specific queries using the examples above
4. Monitor performance and adjust indexes as needed

---

**Schema Status**: ✅ Production Ready for HR Management Systems