# Company Calendar Setup - Enhanced Version

⚠️ **IMPORTANT**: This setup has been updated to allow all employees to create events!

## Database Schema

Run the complete SQL file `database_setup_events.sql` in your Supabase SQL Editor. This will create the enhanced events table with proper permissions.

## Features Implemented

### 1. Calendar Display
- Monthly calendar view with navigation
- Events displayed on appropriate dates
- Color-coded event types with enhanced styling
- Event legend showing all available types
- Event details on hover (title, description, location, creator)

### 2. Event Management

#### **All Employees Can:**
- **Create**: Hall bookings, potlucks, birthdays, team outings, workshops, general events
- **Edit**: Their own events
- **Delete**: Their own events  
- **View**: All approved events

#### **Approvers/Admins Can:**
- **Create**: All event types including company meetings, holidays, announcements
- **Edit**: Any event
- **Delete**: Any event
- **View**: All events

### 3. Enhanced Event Types

#### **Employee Events** (All staff can create):
- `hall_booking` - Emerald (Conference rooms, meeting halls)
- `potluck` - Pink (Social events, potlucks, celebrations)
- `birthday` - Yellow (Birthday celebrations)
- `team_outing` - Indigo (Team building, outings)
- `workshop` - Teal (Training workshops, skill sessions)
- `general` - Gray (General events)

#### **Company Events** (Approvers only):
- `company_meeting` - Blue (Official company meetings)
- `training` - Green (Formal training sessions)
- `holiday` - Red (Company holidays)
- `deadline` - Orange (Important deadlines)
- `announcement` - Purple (Company announcements)

### 4. Enhanced Form Features
- **Location field**: Optional location for events
- **Max attendees**: For hall bookings, workshops, and team outings
- **Role-based form**: Different event types available based on user role
- **Validation**: Proper form validation and error handling
- **Permission notices**: Clear messaging about what users can/cannot create

### 5. Navigation
Calendar buttons added to all dashboards:
- Employee Dashboard
- Approver Dashboard  
- Checker Dashboard
- Admin Dashboard

### 6. API Endpoints (Enhanced)
- `GET /api/events` - Fetch all approved events (all users)
- `POST /api/events` - Create new event (all users, with role-based restrictions)
- `GET /api/events/[id]` - Get specific event (all users)
- `PUT /api/events/[id]` - Update event (owners + approvers)
- `DELETE /api/events/[id]` - Delete event (owners + approvers)

## Usage

### For All Employees:
1. Navigate to any dashboard
2. Click the "Calendar" button in the header
3. View all company events in the monthly calendar
4. Click "Add Event" dropdown and choose:
   - **"Quick Hall Booking"** - Streamlined hall booking (just select hall, time, and purpose)
   - **"Custom Event"** - Full event creation form
5. Click on your own events to edit or delete them
6. View details of any event by hovering over it

### Quick Hall Booking Process:
1. Click "Add Event" → "Quick Hall Booking"
2. Select from available halls/rooms (Conference Room A, Main Hall, etc.)
3. Choose date and time slot
4. Enter purpose/description
5. Set expected attendees (optional)
6. **Event title auto-generated as "Hall Booking: [Hall Name]"**
7. Booking immediately visible to all employees

### For Approvers/Admins:
- All employee features PLUS:
- Create company meetings, holidays, announcements, deadlines
- Edit or delete any event
- Full administrative control over calendar

## Database Setup Required

⚠️ **Critical**: Run the `database_setup_events.sql` file in your Supabase SQL Editor before using the calendar.

## Available Halls/Rooms
The system includes these pre-configured venues:
- **Conference Room A** (20 people) - Ground Floor - Projector, Whiteboard, Audio
- **Conference Room B** (15 people) - Ground Floor - Projector, Whiteboard  
- **Main Hall** (100 people) - First Floor - Projector, Audio, Stage
- **Meeting Room 1** (8 people) - Second Floor - Whiteboard, TV Screen
- **Meeting Room 2** (10 people) - Second Floor - Whiteboard, TV Screen
- **Board Room** (12 people) - Third Floor - Projector, Audio, Whiteboard
- **Training Room** (30 people) - First Floor - Projector, Whiteboard, Audio

## Key Features Summary

✅ **Quick Hall Booking with dropdown selection**  
✅ **Auto-generated titles: "Hall Booking: [Hall Name]"**  
✅ **All employees can book halls and create social events**  
✅ **Role-based permissions with clear restrictions**  
✅ **Enhanced event types with proper color coding**  
✅ **Location and attendee management with capacity limits**  
✅ **Real-time availability and conflict prevention**  
✅ **User-friendly interface with helpful messaging**  
✅ **Proper ownership and editing permissions**