# Multi-Tenant Implementation Guide

## 1. Database Migration
Run the SQL file:
```bash
psql -d your_database -f database-migration-multi-tenant.sql
```

## 2. Update Your Authentication (NextAuth.js)

### Update your NextAuth configuration:

```javascript
// pages/api/auth/[...nextauth].js or app/api/auth/[...nextauth]/route.js

import { sql } from '@vercel/postgres' // or your DB client

export const authOptions = {
  // ... existing config
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch user with organization info
        const result = await sql`
          SELECT u.*, o.name as organization_name, o.slug as organization_slug 
          FROM users u 
          JOIN organizations o ON u.organization_id = o.id 
          WHERE u.email = ${user.email}
        `
        
        if (result.rows[0]) {
          token.organizationId = result.rows[0].organization_id
          token.organizationName = result.rows[0].organization_name
          token.organizationSlug = result.rows[0].organization_slug
          token.role = result.rows[0].role
          token.userId = result.rows[0].id
        }
      }
      return token
    },
    
    async session({ session, token }) {
      session.user.organizationId = token.organizationId
      session.user.organizationName = token.organizationName  
      session.user.organizationSlug = token.organizationSlug
      session.user.role = token.role
      session.user.id = token.userId
      return session
    }
  }
}
```

## 3. Create Organization Context

```javascript
// contexts/OrganizationContext.js
import { createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'

const OrganizationContext = createContext()

export function OrganizationProvider({ children }) {
  const { data: session } = useSession()
  
  const organizationId = session?.user?.organizationId
  const organizationName = session?.user?.organizationName
  
  return (
    <OrganizationContext.Provider value={{ organizationId, organizationName }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
```

## 4. Create Database Utility with Organization Filter

```javascript
// lib/db-with-org.js
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function getOrganizationId(req, res) {
  const session = await getServerSession(req, res, authOptions)
  return session?.user?.organizationId
}

// Wrapper function that automatically adds organization filter
export async function queryWithOrg(query, params = [], req, res) {
  const orgId = await getOrganizationId(req, res)
  if (!orgId) throw new Error('No organization found')
  
  // Add organization_id to all queries
  const orgParams = [...params, orgId]
  const orgQuery = query.replace(/WHERE/i, `WHERE organization_id = $${orgParams.length} AND`)
  
  return await sql.query(orgQuery, orgParams)
}
```

## 5. Update Your API Routes

### Example: Update users API

```javascript
// pages/api/users.js or app/api/users/route.js

import { queryWithOrg } from '@/lib/db-with-org'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // This will automatically filter by organization
      const result = await queryWithOrg(
        'SELECT * FROM users WHERE role = $1',
        ['employee'],
        req,
        res
      )
      
      return res.json(result.rows)
    }
    
    if (req.method === 'POST') {
      const orgId = await getOrganizationId(req, res)
      const { name, email, role } = req.body
      
      const result = await sql`
        INSERT INTO users (name, email, role, organization_id)
        VALUES (${name}, ${email}, ${role}, ${orgId})
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

## 6. Update All Existing API Routes

You need to update ALL your API routes to include organization filtering:

### Travel Requests:
```javascript
// Instead of: SELECT * FROM travel_requests WHERE status = 'pending'
// Use: SELECT * FROM travel_requests WHERE status = 'pending' AND organization_id = $organizationId
```

### Tasks:
```javascript
// Instead of: SELECT * FROM tasks WHERE department_id = $1
// Use: SELECT * FROM tasks WHERE department_id = $1 AND organization_id = $2
```

### Events:
```javascript
// Instead of: SELECT * FROM events WHERE start_date >= $1
// Use: SELECT * FROM events WHERE start_date >= $1 AND organization_id = $2
```

## 7. Organization Switcher (Optional)

```javascript
// components/OrganizationSwitcher.js
import { useSession } from 'next-auth/react'

export function OrganizationHeader() {
  const { data: session } = useSession()
  
  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-sm">
      <span className="font-medium">
        {session?.user?.organizationName || 'Loading...'}
      </span>
    </div>
  )
}
```

## 8. Testing the Implementation

### Test Users Created:
All users have password: `aadhyanta123` (the hashed versions are in the SQL)

**Aadhyanta Fund Management Users:**
- manoj.paudel@aadhyanta.com (Employee)
- amit.koirala@aadhyanta.com (Employee) 
- santosh.thapa@aadhyanta.com (Employee)
- pramesh.pradhan@aadhyanta.com (Approver)
- aashma.mainali@aadhyanta.com (Employee)
- nischal.bhandari@aadhyanta.com (Employee)
- bijesh.rajkarnikar@aadhyanta.com (Employee)
- sumit.bhattarai@aadhyanta.com (Employee)
- asmita.waiba@aadhyanta.com (Employee)
- bimala.waiba@aadhyanta.com (Employee)
- manoj.waiba@aadhyanta.com (Employee)
- supragya.rijal@aadhyanta.com (Employee)
- elina.tamang@aadhyanta.com (Employee)
- arya.subedi@aadhyanta.com (Admin)

## 9. Implementation Checklist

- [ ] Run database migration
- [ ] Update NextAuth configuration
- [ ] Add OrganizationProvider to your app
- [ ] Update all API routes with organization filtering
- [ ] Test login with new users
- [ ] Verify data isolation between organizations
- [ ] Add organization header to UI
- [ ] Update frontend data fetching

## 10. Important Notes

1. **Data Isolation**: Each organization will only see their own data
2. **Same UI**: No frontend changes needed - same components work for all orgs
3. **User Assignment**: Users belong to one organization only
4. **Admin Access**: Organization admins can only manage their organization
5. **Performance**: Indexes added for organization_id columns

The implementation ensures complete data isolation while maintaining the same user experience across organizations.