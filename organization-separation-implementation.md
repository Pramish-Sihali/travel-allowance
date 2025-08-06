# Organization Separation Implementation Guide

## Key Changes Made in V2 Migration:

### 1. **Simple Password**
- **New Password**: `password123` for all users
- Much easier to remember and use for testing

### 2. **Proper Organization Names**
- **InvestInfra** (existing data - your current organization)
- **Aadhyanta Fund Management** (new organization)

### 3. **Organization-Specific Views Created**
- `organization_approvers` - only approvers from same organization
- `organization_employees` - only employees from same organization
- `user_organizations` - easy user-org lookup

## API Changes Required for Proper Separation

### 1. **Update Users/Employees API**

```javascript
// pages/api/users/employees.js
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const organizationId = session?.user?.organizationId
    
    if (!organizationId) {
      return res.status(401).json({ error: 'No organization found' })
    }

    if (req.method === 'GET') {
      // Only get employees from same organization
      const result = await sql`
        SELECT id, name, email, department, designation, role
        FROM users 
        WHERE organization_id = ${organizationId} 
        AND role = 'employee'
        ORDER BY name
      `
      
      return res.json(result.rows)
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 2. **Update Approvers API**

```javascript
// pages/api/users/approvers.js
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const organizationId = session?.user?.organizationId
    
    if (req.method === 'GET') {
      // Only get approvers from same organization
      const result = await sql`
        SELECT id, name, email, department, designation
        FROM users 
        WHERE organization_id = ${organizationId} 
        AND role = 'approver'
        ORDER BY name
      `
      
      return res.json(result.rows)
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 3. **Update Tasks API**

```javascript
// pages/api/tasks.js
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const organizationId = session?.user?.organizationId
    
    if (req.method === 'GET') {
      const result = await sql`
        SELECT t.*, d.name as department_name 
        FROM tasks t
        JOIN departments d ON t.department_id = d.id
        WHERE t.organization_id = ${organizationId}
        ORDER BY t.created_at DESC
      `
      
      return res.json(result.rows)
    }
    
    if (req.method === 'POST') {
      const { title, description, departmentId, assignedTo, priority } = req.body
      
      const result = await sql`
        INSERT INTO tasks (title, description, department_id, assigned_to, priority, organization_id, created_by)
        VALUES (${title}, ${description}, ${departmentId}, ${assignedTo}, ${priority}, ${organizationId}, ${session.user.id})
        RETURNING *
      `
      
      return res.json(result.rows[0])
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 4. **Update Attendance APIs**

```javascript
// pages/api/attendance.js
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const organizationId = session?.user?.organizationId
    
    if (req.method === 'GET') {
      const result = await sql`
        SELECT * FROM attendance 
        WHERE organization_id = ${organizationId}
        ORDER BY date DESC
      `
      
      return res.json(result.rows)
    }
    
    if (req.method === 'POST') {
      const { employee_id, employee_name, date, status } = req.body
      
      const result = await sql`
        INSERT INTO attendance (employee_id, employee_name, date, status, organization_id)
        VALUES (${employee_id}, ${employee_name}, ${date}, ${status}, ${organizationId})
        RETURNING *
      `
      
      return res.json(result.rows[0])
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 5. **Update Travel Requests API**

```javascript
// pages/api/travel-requests.js
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const organizationId = session?.user?.organizationId
    
    if (req.method === 'GET') {
      const result = await sql`
        SELECT * FROM travel_requests 
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `
      
      return res.json(result.rows)
    }
    
    if (req.method === 'POST') {
      const requestData = req.body
      
      const result = await sql`
        INSERT INTO travel_requests (..., organization_id)
        VALUES (..., ${organizationId})
        RETURNING *
      `
      
      return res.json(result.rows[0])
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

## Key Implementation Points:

### 1. **Organization Context in Frontend**
```javascript
// Add this to your main app layout
export function OrganizationProvider({ children }) {
  const { data: session } = useSession()
  
  return (
    <div>
      {session?.user?.organizationName && (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">
          {session.user.organizationName}
        </div>
      )}
      {children}
    </div>
  )
}
```

### 2. **Middleware for Organization Validation**
```javascript
// middleware/organization.js
export function withOrganization(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.organizationId) {
      return res.status(401).json({ error: 'No organization access' })
    }
    
    req.organizationId = session.user.organizationId
    return handler(req, res)
  }
}
```

### 3. **Update All Data Fetching**
Every API call that fetches users, tasks, attendance, etc. should include:
```sql
WHERE organization_id = ${organizationId}
```

## Testing the Separation:

1. **Login as InvestInfra user** - should only see InvestInfra data
2. **Login as Aadhyanta user** - should only see Aadhyanta data
3. **Check approver dropdowns** - should only show approvers from same org
4. **Check employee lists** - should only show employees from same org

## Login Credentials:

### **InvestInfra** (existing users - password unchanged):
- Use existing login credentials

### **Aadhyanta Fund Management**:
- **Username**: any @aadhyanta.com email
- **Password**: `password123`

**Approvers:**
- santosh.thapa@aadhyanta.com
- pramesh.pradhan@aadhyanta.com

**Employees:** All others

This ensures complete data isolation between organizations! 🎯