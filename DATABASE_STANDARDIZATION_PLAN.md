# Database Standardization Plan
## Travel Allowance System - API & Database Issues Resolution

### **Executive Summary**
The system has solid architecture but suffers from naming inconsistency between database (snake_case) and frontend (camelCase), causing API confusion and dataflow issues. This plan addresses these problems through systematic database standardization.

---

## **Problem Analysis**

### **Root Causes**
1. **Naming Convention Mismatch**: Database uses snake_case while frontend expects camelCase
2. **Schema Drift**: Multiple schema files suggest actual DB structure doesn't match code expectations
3. **Complex Data Transformations**: Manual mapping in `lib/db.ts` creates error-prone conversion layers
4. **Type Definition Mismatches**: TypeScript types don't perfectly align with database columns

### **Impact on System**
- API endpoints getting confused with field mappings
- Dataflow breaking due to field name mismatches  
- Increased debugging complexity
- Higher maintenance overhead
- Potential data integrity issues

---

## **Recommended Solution: Database Standardization**

### **Strategy: Convert Database to camelCase (Option A)**
**Why this approach:**
- Eliminates the major source of API confusion
- Simplifies codebase by removing transformation layers
- Makes debugging significantly easier
- Modern PostgreSQL fully supports camelCase identifiers
- Reduces long-term maintenance burden

---

## **Implementation Plan**

### **Phase 1: Schema Audit & Assessment**
**Objectives:**
- Document current actual database structure
- Identify discrepancies between schema files and reality
- Map all field transformations currently happening in code

**Tasks:**
1. Export current database schema structure
2. Compare actual DB columns with TypeScript type definitions
3. Audit all transformation functions in `lib/db.ts`
4. Identify which schema files are current vs outdated
5. Document all foreign key relationships and constraints

**Deliverables:**
- Current schema documentation
- Field mapping spreadsheet
- Schema file audit report

### **Phase 2: Migration Strategy Development**
**Objectives:**
- Plan safe column renaming approach
- Minimize system downtime
- Ensure data integrity throughout process

**Tasks:**
1. Create table-by-table migration plan
2. Develop rollback procedures
3. Plan testing strategy for each migration
4. Identify critical dependencies and order of operations

**Deliverables:**
- Migration script templates
- Testing checklist
- Rollback procedures

### **Phase 3: Code Preparation**
**Objectives:**
- Prepare codebase for new database structure
- Update type definitions
- Remove transformation layers

**Tasks:**
1. Update all TypeScript interfaces to use camelCase
2. Modify API endpoints to work with new field names
3. Remove snake_case to camelCase conversion logic
4. Update all database queries

**Deliverables:**
- Updated type definitions
- Modified API endpoints
- Cleaned up database helper functions

### **Phase 4: Database Migration Execution**
**Objectives:**
- Execute safe column renaming
- Verify data integrity
- Update constraints and indexes

**Tasks:**
1. Execute migrations table by table
2. Verify data integrity after each table
3. Update foreign key constraints
4. Rebuild indexes with new column names
5. Update RLS policies

**Deliverables:**
- Migrated database with camelCase columns
- Updated constraints and indexes
- Verified data integrity

### **Phase 5: System Integration & Testing**
**Objectives:**
- Ensure all APIs work with new database structure
- Comprehensive testing of dataflow
- Performance verification

**Tasks:**
1. Integration testing of all API endpoints
2. End-to-end testing of critical user flows
3. Performance testing and optimization
4. Documentation updates

**Deliverables:**
- Fully tested system
- Updated documentation
- Performance benchmarks

---

## **Immediate Quick Wins (While Planning Migration)**

### **Security Fixes (Critical)**
1. **Password Hashing**: Implement bcrypt for password storage immediately
2. **Input Validation**: Add comprehensive request validation to all endpoints
3. **SQL Injection Prevention**: Ensure all queries use parameterized statements

### **Code Quality Improvements**
1. **Error Response Standardization**: Unify error response format across all endpoints
2. **Schema File Consolidation**: Merge multiple schema files into single source of truth
3. **Logging Enhancement**: Improve debugging capabilities with better logging

### **Documentation**
1. **API Documentation**: Document expected request/response formats
2. **Database Schema Documentation**: Create definitive schema documentation
3. **Development Guidelines**: Establish naming conventions and coding standards

---

## **Risk Mitigation Strategies**

### **Data Safety**
- **Full database backup** before any migration
- **Table-by-table approach** to minimize blast radius
- **Immediate rollback capability** for each step
- **Data integrity verification** after each migration

### **System Availability**
- **Off-hours migration scheduling** to minimize user impact
- **Staged rollout approach** starting with less critical tables
- **Monitoring and alerting** during migration process

### **Code Compatibility**
- **Feature flag approach** to enable gradual transition
- **Backward compatibility layer** during transition period
- **Comprehensive testing suite** before production deployment

---

## **Success Metrics**

### **Technical Metrics**
- **Reduced API Error Rate**: Target <1% API errors related to field mapping
- **Simplified Codebase**: Remove 80%+ of field transformation code
- **Improved Performance**: 20%+ reduction in API response times
- **Enhanced Developer Productivity**: Faster debugging and development

### **Business Metrics**
- **Reduced Support Tickets**: Fewer issues related to data inconsistencies
- **Improved User Experience**: More reliable application behavior
- **Lower Maintenance Costs**: Reduced time spent on schema-related issues

---

## **Timeline Estimate**

### **Phase 1**: Schema Audit (1-2 weeks)
### **Phase 2**: Migration Planning (1 week)  
### **Phase 3**: Code Preparation (2-3 weeks)
### **Phase 4**: Migration Execution (1 week)
### **Phase 5**: Testing & Integration (1-2 weeks)

**Total Estimated Duration: 6-9 weeks**

---

## **Next Steps**

1. **Schema Files Analysis**: Request access to all current schema files for comprehensive audit
2. **Database Schema Export**: Generate current database structure documentation
3. **Field Mapping Documentation**: Create comprehensive mapping of all current transformations
4. **Stakeholder Approval**: Get approval for migration approach and timeline
5. **Resource Allocation**: Assign team members and schedule migration windows

---

## **Current State Analysis - COMPLETED** ✅

### **Major Issues Identified**

#### **1. Critical Field Mapping Problems**
- **notifications table**: Has both `is_read` AND `read` fields (duplicate functionality)
- **tasks table**: Uses custom ENUM types (`task_status`, `task_priority`, `rag_status`) but code expects strings
- **time_logs table**: Missing key fields that code expects (`task_type`, `hours_spent`, `date`, `user_name`)
- **meeting_minutes table**: Has `task_id` field but no clear relationship established in code

#### **2. Inconsistent ID Generation**
- Mix of `uuid_generate_v4()` and `gen_random_uuid()` functions
- Some tables missing DEFAULT values for UUIDs

#### **3. Missing Tables/Relationships**
- **task_action_items table**: Referenced in schema files but missing from main schema
- **time_logs table**: Structure completely different from what code expects

#### **4. Data Type Mismatches**
- **employee_id fields**: Mix of `text` and `uuid` types across tables
- **Arrays**: Some stored as PostgreSQL arrays, others as JSON strings

---

## **Detailed Migration Plan - UPDATED**

### **Phase 1: Critical Fixes (Week 1)**

#### **1.1 Fix Duplicate Fields**
```sql
-- Remove duplicate read field from notifications
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
```

#### **1.2 Standardize UUID Generation**
```sql
-- Standardize all tables to use gen_random_uuid()
-- (Will provide specific scripts for each table)
```

#### **1.3 Fix time_logs Table Structure**
The current `time_logs` table doesn't match what your code expects. Need to:
- Add missing fields: `task_type`, `hours_spent`, `date`, `user_name`
- Remove fields not used by code: `start_time`, `end_time`, `total_duration`, etc.

### **Phase 2: Convert to camelCase (Weeks 2-3)**

#### **Priority Tables for Migration:**
1. **users** - Core authentication table
2. **travel_requests** - Main business logic table  
3. **notifications** - User interaction table
4. **tasks** - Task management table
5. **time_logs** - Time tracking table

#### **Field Conversion Examples:**
```sql
-- travel_requests table
ALTER TABLE travel_requests RENAME COLUMN employee_id TO employeeId;
ALTER TABLE travel_requests RENAME COLUMN employee_name TO employeeName;
ALTER TABLE travel_requests RENAME COLUMN travel_date_from TO travelDateFrom;
-- ... (will provide complete list)
```

### **Phase 3: Add Missing Tables (Week 3)**
```sql
-- Create task_action_items table (from your schema files)
-- Update relationships and constraints
```

---

## **Immediate Actions Required**

### **1. Critical Database Fixes (Do First)**

#### **Fix notifications table:**
```sql
-- Remove duplicate field
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
```

#### **Fix time_logs table structure:**
```sql
-- Current structure doesn't match code expectations
-- Need to add: task_type, hours_spent, date, user_name fields
-- Or rebuild table to match code requirements
```

#### **Create missing task_action_items table:**
```sql
-- Table exists in schema files but not in main database
-- Required for task action items functionality
```

### **2. Code Fixes (Parallel to DB fixes)**

#### **Update lib/db.ts mapping functions:**
- Remove complex field transformations
- Simplify data mapping
- Fix type mismatches

#### **Update TypeScript types:**
- Fix enum types for tasks table
- Align notification types  
- Correct time_logs interface

---

## **Next Steps - Ready to Execute**

1. **Backup Database** - Create full backup before any changes
2. **Execute Critical Fixes** - Fix the immediate blocking issues
3. **Run Test Suite** - Verify APIs work after fixes
4. **Plan camelCase Migration** - Table by table conversion
5. **Update Code** - Remove transformation layers

**Ready to proceed with specific migration scripts?**

---

*Document updated with current state analysis - Ready for implementation phase.*