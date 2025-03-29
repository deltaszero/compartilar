Refactor the backend for a shared calendar system with the following requirements:

Data Structure:
- Each calendar event should contain:
  - Title
  - Description
  - Start date/time
  - End date/time
  - Location (optional)
  - Event type/category
  - Creator ID
  - Last modified by ID
  - Timestamps for creation and updates
  - Associated child/children IDs
  - Recurrence rules (if applicable)
  - Reminder settings (if applicable)

Permission Model:
- The calendar is shared among all editors of a child
- Each child has two types of users:
  - Editors: Full CRUD permissions on calendar events
  - Viewers: Read-only access to calendar events
- Permission inheritance:
  - If a user is an editor for any child, they have edit rights for that child's events
  - If a user is only a viewer for a child, they can only view that child's events

Backend Requirements:
1. Event Creation:
   - Validate the creator is an editor for the associated child/children
   - Create the event with proper metadata
   - Make the event visible to all editors and viewers of the associated children

2. Event Updates:
   - Verify the user has editor permissions before allowing changes
   - Update the "last modified by" field and timestamp
   - Log the changes in an audit trail

3. Event Deletion:
   - Restrict deletion to editors only
   - Implement soft deletion to maintain history
   - Update visibility for all affected users

4. Event Retrieval:
   - Filter events based on user permissions
   - For editors: Return events with edit controls enabled
   - For viewers: Return events with edit controls disabled
   - Support filtering by date range, child, and event type

5. Calendar Views:
   - Support day, week, month, and agenda views
   - Aggregate events across all children the user has access to
   - Clearly indicate which child each event is associated with

6. Synchronization:
   - Implement real-time updates when events change
   - Handle concurrent edit conflicts with appropriate locking or merge strategy
   - Ensure consistent state across all users viewing the calendar

7. Notifications:
   - Notify relevant editors when events are created, updated, or deleted
   - Send reminders based on event settings
   - Allow users to customize notification preferences

Performance Considerations:
- Implement efficient queries for calendar views
- Cache frequently accessed calendar data
- Optimize for mobile bandwidth when synchronizing

API Endpoints to Implement:
- GET /calendar/events - List events with filtering options
- GET /calendar/events/:id - Get specific event details
- POST /calendar/events - Create a new event
- PUT /calendar/events/:id - Update an existing event
- DELETE /calendar/events/:id - Delete/archive an event
- GET /calendar/permissions/:childId - Get user permissions for a specific child's calendar

Please ensure all endpoints validate user permissions and handle errors appropriately.