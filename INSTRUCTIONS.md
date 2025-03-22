Refactor the entire /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano to match with the following requirements:

Data Structure:
- Each parental plan document should have:
  - A title field
  - An array of linked children IDs (minimum one)
  - An array of editor IDs (minimum one)
  - Ten topic sections (education, custody, etc.)
  - A log subcollection for tracking changes
  - A timestamp for creation and last update

Topic Structure:
- Each topic should be a form with multiple questions
- Each question should store:
  - Current value
  - Previous value (for rollback)
  - Status (approved, pending, disagreed)
  - Timestamp of last change
  - ID of user who made last change
  - ID of user who approved/rejected (if applicable)

Change Request Flow:
1. When an editor modifies a question:
   - Lock the question
   - Set status to "pending"
   - Store current value as previous value
   - Create a change request notification for other editors
   - Log the change request in the plan's log subcollection

2. For canceling a change request:
   - Allow only the editor who made the change to cancel
   - Roll back to previous value in database
   - Unlock the question
   - Remove the pending notification
   - Log the cancellation

3. For approving a change request:
   - Update the value in the database
   - Add an acceptance badge with timestamp
   - Unlock the question
   - Set status to "approved"
   - Log the approval

4. For rejecting a change request:
   - Roll back to previous value
   - Add a disagreement badge with timestamp
   - Unlock the question
   - Set status to "disagreed"
   - Log the rejection

UI Requirements:
- Display parental plan cards in each editor's dashboard
- Show badges for pending, approved, and disagreed questions
- Include timestamps for all changes
- Provide a log view showing the history of changes
- Add controls for approving, rejecting, or canceling changes

Notifications:
- Send notifications to other editors when changes are requested
- Alert the requesting editor when their change is approved or rejected
- Provide a summary of pending requests on the dashboard

Please implement this with appropriate database schema, API endpoints, and front-end components.