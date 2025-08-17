# Travel Allowance System - API Documentation

This document provides comprehensive documentation of all API endpoints in the Travel Allowance System, including request/response formats and authentication requirements.

## Authentication

🔐 **All API endpoints require authentication** via NextAuth session. When testing:

1. **Via Browser**: First login at `http://localhost:3000` to establish a session
2. **Via Postman/CLI**: Include session cookies or authentication headers
3. **Unauthorized requests** will redirect to the login page

### Testing Authentication
```bash
# First, get a session cookie by logging in through the browser
# Then use the cookie in subsequent requests:
curl -X GET "http://localhost:3000/api/departments" \
     -H "Cookie: next-auth.session-token=your-session-token"
```

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## API Status Summary
✅ **All APIs are working correctly** - Recent fixes include:
- Fixed database schema mismatches (snake_case ↔ camelCase transformations)
- Resolved field mapping issues across all endpoints
- Implemented missing expense functions
- Fixed all form submission and data retrieval issues

---

## 📊 Dashboard APIs

### GET /api/dashboard/employee
**Description**: Get employee dashboard data including stats and recent activities
**Authentication**: Required (Employee role)
**Query Parameters**:
- `userId` (string): Employee ID

**Response**:
```json
{
  "stats": {
    "totalRequests": 5,
    "pendingRequests": 2,
    "approvedRequests": 3,
    "rejectedRequests": 0,
    "totalExpenses": 15000.00,
    "pendingExpenses": 5000.00
  },
  "recentRequests": [
    {
      "id": "uuid",
      "requestType": "normal",
      "status": "pending",
      "totalAmount": 5000.00,
      "createdAt": "2024-01-15T10:30:00Z",
      "project": "Project Alpha"
    }
  ],
  "notifications": [
    {
      "id": "uuid",
      "message": "Your travel request has been approved",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/dashboard/approver
**Description**: Get approver dashboard data with pending requests
**Authentication**: Required (Approver/Admin role)

**Response**:
```json
{
  "stats": {
    "pendingApprovals": 8,
    "approvedToday": 3,
    "rejectedToday": 1,
    "totalRequests": 25
  },
  "pendingRequests": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "John Doe",
      "requestType": "advance",
      "totalAmount": 8000.00,
      "urgencyLevel": "normal",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🚗 Travel Requests APIs

### GET /api/requests
**Description**: Get travel requests (filtered by employee or all for approvers)
**Authentication**: Required
**Query Parameters**:
- `employeeId` (string, optional): Filter by specific employee

**Response**:
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "John Doe",
    "department": "Engineering",
    "designation": "Software Engineer",
    "requestType": "normal",
    "project": "Project Alpha",
    "projectOther": null,
    "purpose": "Client meeting",
    "purposeType": "meeting",
    "purposeOther": null,
    "location": "Mumbai",
    "locationOther": null,
    "travelDateFrom": "2024-01-20",
    "travelDateTo": "2024-01-22",
    "transportMode": "flight",
    "stationPickDrop": "Airport pickup required",
    "localConveyance": "taxi",
    "rideShareUsed": false,
    "ownVehicleReimbursement": false,
    "totalAmount": 15000.00,
    "previousOutstandingAdvance": 0,
    "isGroupTravel": false,
    "isGroupCaptain": false,
    "groupSize": null,
    "groupMembers": null,
    "groupDescription": null,
    "estimatedAmount": null,
    "advanceNotes": null,
    "emergencyReason": null,
    "emergencyReasonOther": null,
    "emergencyJustification": null,
    "emergencyAmount": null,
    "needsFinancialAttention": false,
    "isUrgent": false,
    "status": "pending",
    "phase": 1,
    "approverId": "uuid",
    "approverComments": null,
    "checkerComments": null,
    "financeComments": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "travelDetailsApprovedAt": null,
    "expensesSubmittedAt": null
  }
]
```

### POST /api/requests
**Description**: Create a new travel request
**Authentication**: Required
**Request Body**:
```json
{
  "employeeId": "uuid",
  "employeeName": "John Doe",
  "department": "Engineering",
  "designation": "Software Engineer",
  "requestType": "normal",
  "project": "uuid-or-name",
  "projectOther": "Custom project name",
  "purpose": "Client meeting and training",
  "purposeType": "meeting",
  "location": "Mumbai",
  "travelDateFrom": "2024-01-20",
  "travelDateTo": "2024-01-22",
  "transportMode": "flight",
  "stationPickDrop": "Airport pickup required",
  "localConveyance": "taxi",
  "rideShareUsed": false,
  "ownVehicleReimbursement": false,
  "totalAmount": 15000.00,
  "approverId": "uuid",
  "isGroupTravel": false,
  "estimatedAmount": "15000",
  "advanceNotes": "Required for hotel booking"
}
```

**Response**: Same as GET request item format

---

## 🏔️ Valley Requests APIs

### GET /api/valley-requests
**Description**: Get in-valley travel requests
**Authentication**: Required
**Query Parameters**:
- `employeeId` (string, optional): Filter by specific employee

**Response**:
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "Jane Smith",
    "department": "Sales",
    "designation": "Sales Manager",
    "requestType": "in-valley",
    "project": "Local Client Visits",
    "purpose": "Client meeting",
    "expenseDate": "2024-01-18",
    "location": "Local office",
    "description": "Meeting with potential clients",
    "paymentMethod": "company_card",
    "meetingType": "client",
    "meetingParticipants": "John, Sarah, Client team",
    "totalAmount": 2500.00,
    "status": "pending",
    "travelDateFrom": "2024-01-18",
    "travelDateTo": "2024-01-18",
    "createdAt": "2024-01-15T14:20:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "approverId": "uuid",
    "organizationId": "uuid"
  }
]
```

### POST /api/valley-requests
**Description**: Create a new valley request
**Authentication**: Required
**Request Body**:
```json
{
  "employeeId": "uuid",
  "employeeName": "Jane Smith",
  "department": "Sales",
  "designation": "Sales Manager",
  "project": "Local Client Visits",
  "purposeType": "meeting",
  "purposeOther": "Custom purpose",
  "expenseDate": "2024-01-18",
  "location": "Client office downtown",
  "description": "Quarterly review meeting",
  "paymentMethod": "company_card",
  "meetingType": "client",
  "meetingParticipants": "Team leads and clients",
  "totalAmount": 2500.00,
  "approverId": "uuid"
}
```

---

## 📋 Tasks APIs

### GET /api/tasks
**Description**: Get all tasks with filtering options
**Authentication**: Required
**Query Parameters**:
- `assignedTo` (string, optional): Filter by assigned user
- `status` (string, optional): Filter by status
- `departmentId` (string, optional): Filter by department

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Implement user authentication",
    "description": "Build secure login system with JWT",
    "departmentId": "uuid",
    "departmentName": "Engineering",
    "assignedTo": ["John Doe", "Jane Smith"],
    "assignedUserIds": ["uuid1", "uuid2"],
    "status": "In Progress",
    "priority": "High",
    "ragStatus": "Green",
    "dueDate": "2024-01-25",
    "startDate": "2024-01-15",
    "completionDate": null,
    "bottlenecks": "Waiting for API documentation",
    "ragTakeaway": "On track, no major issues",
    "remarks": "Making good progress",
    "createdBy": "uuid",
    "createdByName": "Manager Name",
    "lastUpdatedBy": "uuid",
    "lastUpdatedByName": "John Doe",
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-16T15:30:00Z"
  }
]
```

### POST /api/tasks
**Description**: Create a new task
**Authentication**: Required
**Request Body**:
```json
{
  "title": "New feature development",
  "description": "Implement the requested feature",
  "departmentId": "uuid",
  "assignedTo": ["John Doe"],
  "assignedUserIds": ["uuid"],
  "status": "Not Started",
  "priority": "Medium",
  "ragStatus": "Unrated",
  "dueDate": "2024-02-01",
  "startDate": "2024-01-20"
}
```

### GET /api/tasks/[id]
**Description**: Get specific task details
**Authentication**: Required
**Path Parameters**:
- `id` (string): Task ID

**Response**: Same as single task object from GET /api/tasks

### PUT /api/tasks/[id]
**Description**: Update a task completely
**Authentication**: Required (Owner, Assignee, or Approver)
**Request Body**: Same as POST /api/tasks

### PATCH /api/tasks/[id]
**Description**: Update task status and completion
**Authentication**: Required (Owner, Assignee, or Approver)
**Request Body**:
```json
{
  "status": "Completed",
  "completionDate": "2024-01-20",
  "updateRemark": "Successfully completed all requirements"
}
```

---

## ⏰ Time Logs APIs

### GET /api/time-logs
**Description**: Get time logs for user or date range
**Authentication**: Required
**Query Parameters**:
- `userId` (string, optional): User ID
- `date` (string, optional): Specific date (YYYY-MM-DD)
- `startDate` (string, optional): Start date for range
- `endDate` (string, optional): End date for range
- `personal` (boolean, optional): Filter personal logs

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "taskId": "uuid",
    "organizationId": "uuid",
    "description": "Working on user authentication feature",
    "startTime": "09:00:00",
    "endTime": "17:30:00",
    "totalDuration": 510,
    "breakDuration": 60,
    "isPersonal": false,
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T17:30:00Z",
    "meetingActionItemId": null,
    "taskType": "development",
    "hoursSpent": 8.5,
    "date": "2024-01-15",
    "userName": "John Doe",
    "taskTitle": "Implement user authentication"
  }
]
```

### POST /api/time-logs
**Description**: Create a new time log entry
**Authentication**: Required
**Request Body**:
```json
{
  "userId": "uuid",
  "taskId": "uuid",
  "description": "Implemented login functionality",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "totalDuration": 480,
  "breakDuration": 60,
  "isPersonal": false,
  "taskType": "development",
  "date": "2024-01-15"
}
```

---

## 📝 Leave Requests APIs

### GET /api/leave-requests
**Description**: Get leave requests
**Authentication**: Required
**Query Parameters**:
- `employeeId` (string, optional): Filter by employee ID

**Response**:
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "John Doe",
    "department": "Engineering",
    "leaveType": "vacation",
    "reason": "Family vacation to Goa",
    "isAdvanced": false,
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "approverId": "uuid",
    "approverName": "Manager Name"
  }
]
```

### POST /api/leave-requests
**Description**: Submit a new leave request
**Authentication**: Required
**Request Body**:
```json
{
  "leaveType": "sick",
  "reason": "Medical appointment and recovery",
  "isAdvanced": true
}
```

### PATCH /api/leave-requests
**Description**: Update leave request status (for approvers)
**Authentication**: Required (Approver/Admin role)
**Request Body**:
```json
{
  "id": "uuid",
  "status": "approved"
}
```

---

## 💰 Expenses APIs

### GET /api/expenses
**Description**: Get expense items for a request
**Authentication**: Required
**Query Parameters**:
- `requestId` (string): Travel request ID

**Response**:
```json
[
  {
    "id": "uuid",
    "requestId": "uuid",
    "category": "accommodation",
    "amount": 5000.00,
    "description": "Hotel stay for 2 nights",
    "status": "pending",
    "organizationId": "uuid"
  }
]
```

### POST /api/expenses
**Description**: Create a new expense item
**Authentication**: Required
**Request Body**:
```json
{
  "requestId": "uuid",
  "category": "per-diem",
  "amount": 1500.00,
  "description": "Daily allowance for meals",
  "organizationId": "uuid"
}
```

---

## 📅 Events/Calendar APIs

### GET /api/events
**Description**: Get calendar events for organization
**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Team Meeting",
    "description": "Weekly sync meeting",
    "startDate": "2024-01-20",
    "endDate": "2024-01-20",
    "startTime": "10:00:00",
    "endTime": "11:00:00",
    "isAllDay": false,
    "eventType": "meeting",
    "location": "Conference Room A",
    "hallId": "uuid",
    "createdBy": "uuid",
    "createdByName": "John Doe",
    "createdByRole": "employee",
    "maxAttendees": 10,
    "currentAttendees": 5,
    "requiresApproval": false,
    "approvalStatus": "approved",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### POST /api/events
**Description**: Create a new calendar event
**Authentication**: Required
**Request Body**:
```json
{
  "title": "Project Kickoff",
  "description": "Starting new project with stakeholders",
  "startDate": "2024-01-25",
  "endDate": "2024-01-25",
  "startTime": "14:00:00",
  "endTime": "16:00:00",
  "isAllDay": false,
  "eventType": "meeting",
  "location": "Main Conference Room",
  "maxAttendees": 15
}
```

---

## 🤝 Meetings APIs

### GET /api/meetings
**Description**: Get meetings for organization
**Authentication**: Required
**Query Parameters**:
- `employeeId` (string, optional): Filter by specific employee

**Response**:
```json
{
  "meetings": [
    {
      "id": "uuid",
      "title": "Client Strategy Discussion",
      "description": "Quarterly review with client",
      "taskId": "uuid",
      "meetingType": "external",
      "clientId": "uuid",
      "location": "Client Office",
      "locationType": "external",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "locationAddress": "Mumbai, Maharashtra",
      "meetingDate": "2024-01-22",
      "meetingTime": "14:00:00",
      "durationMinutes": 120,
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "assignedTo": "uuid",
      "assignedToName": "Jane Smith",
      "deadlineDate": "2024-01-25",
      "deadlineTime": "17:00:00",
      "priority": "high",
      "status": "scheduled",
      "organizationId": "uuid",
      "action_items_count": 0,
      "completed_action_items": 0,
      "attendeeCount": 0
    }
  ],
  "stats": {
    "totalMeetings": 15,
    "scheduledMeetings": 8,
    "completedMeetings": 7,
    "pendingActionItems": 12,
    "overdueMeetings": 2,
    "upcomingDeadlines": 3
  }
}
```

### POST /api/meetings
**Description**: Create a new meeting with action items
**Authentication**: Required
**Request Body**:
```json
{
  "title": "Project Review Meeting",
  "description": "Review current project status",
  "meetingType": "internal",
  "locationType": "office",
  "locationDetails": "Conference Room B",
  "meetingDate": "2024-01-25",
  "meetingTime": "10:00:00",
  "duration": "60",
  "assignedTo": "uuid",
  "deadlineDate": "2024-01-30",
  "priority": "medium",
  "meetingMinutes": [
    {
      "serialNo": 1,
      "responsibility": "Prepare project documentation",
      "assignedToId": "uuid",
      "assignedToName": "John Doe",
      "deadline": "2024-01-28",
      "remarks": "Include all technical specifications",
      "isDone": false
    }
  ],
  "internalAttendees": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@company.com"
    }
  ],
  "externalAttendees": [],
  "createdBy": "uuid",
  "createdByName": "Manager Name"
}
```

---

## 🔔 Notifications APIs

### GET /api/notifications
**Description**: Get notifications for user
**Authentication**: Required
**Query Parameters**:
- `userId` (string): User ID

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "requestId": "uuid",
    "message": "Your travel request has been approved",
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "requestType": "travel"
  }
]
```

### POST /api/notifications/[id]/read
**Description**: Mark notification as read
**Authentication**: Required
**Path Parameters**:
- `id` (string): Notification ID

**Response**:
```json
{
  "message": "Notification marked as read"
}
```

### POST /api/notifications/mark-all-read
**Description**: Mark all notifications as read for user
**Authentication**: Required
**Request Body**:
```json
{
  "userId": "uuid"
}
```

---

## 👥 Users APIs

### GET /api/users/employees
**Description**: Get all employees in organization
**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "employee",
    "department": "Engineering",
    "designation": "Software Engineer",
    "organizationId": "uuid"
  }
]
```

### GET /api/approvers
**Description**: Get all approvers in organization
**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Jane Manager",
    "email": "jane.manager@company.com",
    "role": "approver",
    "department": "Management"
  }
]
```

---

## 🏢 Projects APIs

### GET /api/projects
**Description**: Get all projects
**Authentication**: Required

**Response**:
```json
[
  {
    "value": "uuid",
    "label": "Project Alpha - Mobile App"
  }
]
```

### POST /api/projects
**Description**: Create a new project
**Authentication**: Required
**Request Body**:
```json
{
  "name": "New Project Beta"
}
```

---

## 🏢 Departments APIs

### GET /api/departments
**Description**: Get all departments
**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "description": "Software development team"
  }
]
```

---

## 📊 Attendance APIs

### GET /api/attendance
**Description**: Get attendance records
**Authentication**: Required
**Query Parameters**:
- `userId` (string): User ID
- `date` (string, optional): Specific date

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "date": "2024-01-15",
    "status": "present",
    "checkInTime": "09:00:00",
    "checkOutTime": "17:30:00",
    "totalHours": 8.5,
    "remarks": null,
    "createdAt": "2024-01-15T09:00:00Z"
  }
]
```

### POST /api/attendance
**Description**: Mark attendance
**Authentication**: Required
**Request Body**:
```json
{
  "userId": "uuid",
  "status": "present",
  "remarks": "On time"
}
```

---

## Error Responses

All APIs return consistent error responses:

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

---

## Rate Limiting

- No rate limiting currently implemented
- Recommended: 100 requests per minute per user

## Testing Results Summary

### ✅ API Health Status
All endpoints are functional and returning expected responses. The recent comprehensive fixes have resolved:

1. **Database Schema Alignment**: All snake_case ↔ camelCase transformations working correctly
2. **Data Integrity**: Field mappings consistent across all modules
3. **Authentication**: Proper session-based authentication on all endpoints
4. **Error Handling**: Consistent error responses with appropriate HTTP status codes

### 🧪 Test Coverage
- **Travel Requests**: ✅ Create, Read, Update operations tested
- **Valley Requests**: ✅ CRUD operations with proper field transformations
- **Tasks Management**: ✅ Full CRUD with status updates
- **Time Logs**: ✅ Creation and retrieval with duration calculations
- **Expenses**: ✅ Both travel and valley expense handling
- **Leave Requests**: ✅ Submission and approval workflows
- **Events/Calendar**: ✅ Event creation and management
- **Meetings**: ✅ Meeting creation with action items
- **Notifications**: ✅ Real-time notification system
- **User Management**: ✅ Employee and approver lookups
- **Dashboard APIs**: ✅ Statistical data aggregation

### 🔧 Recent Fixes Applied
1. Fixed `totalduration` → `totalDuration` mappings in time logs
2. Resolved task editing failures with proper field transformations  
3. Implemented missing expense functions with complete CRUD operations
4. Fixed navigation redirects for "View My Requests" buttons
5. Resolved modal z-index issues in forms
6. Standardized all API response formats for consistency

### 📊 Performance Notes
- All endpoints respond within expected timeframes
- Database queries optimized with proper indexing
- Field transformations add minimal overhead
- Session-based authentication is secure and efficient

## Changelog

- **v1.2** (2024-01-17): **Major Stability Release**
  - Fixed all database schema mismatches (snake_case ↔ camelCase transformations)
  - Added comprehensive field mappings for all endpoints
  - Resolved data transformation issues across all modules
  - Implemented missing expense functions
  - Fixed UI navigation and form issues
  - Added complete API documentation with examples

- **v1.1** (2024-01-16): Enhanced error handling and validation
- **v1.0** (2024-01-15): Initial API documentation

---

*Last updated: January 17, 2024*