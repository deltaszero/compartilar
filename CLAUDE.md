# CompartiLar Development Guidelines

## Build Commands
- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Run development server accessible from other devices on network
- `firebase deploy --only firestore:rules` - Deploy Firestore security rules
- `firebase deploy --only storage:rules` - Deploy Storage rules

## Code Style & Conventions
- **TypeScript**: Use strict typing with proper interfaces/types; define shared types in `/types/` directory
- **Components**: Use React functional components with hooks; follow separation of concerns
- **Firebase**: Follow `collection/document/subcollection` pattern; use helper functions from `/app/lib/firebaseConfig.ts`. The rules are in `/home/dusoudeth/Documentos/github/compartilar/.firestore-rules` and `/home/dusoudeth/Documentos/github/compartilar/.storage-rules`
- **Imports Order**: React/Next.js core, Firebase, external libraries, internal components, types, styles
- **Naming**: PascalCase for components, camelCase for variables/functions, snake_case for Firebase collections
- **CSS**: Use Tailwind CSS utility classes; consistent color scheme using design system variables
- **Formatting**: 2-space indentation, single quotes for strings, semicolons at end of statements
- **Error Handling**: Use try/catch for Firebase operations with proper console.error and user-facing toast messages
- **Performance**: Optimize Firebase queries with proper indexes; use Firestore listeners wisely with the listener management utilities

## Project Structure
- App Router-based organization with route groups: `(auth)`, `(user)`, etc.
- User-specific pages under `app/(user)/[username]/` with shared components
- UI components in `/components/ui/` (shadcn/ui based components)
- Firebase utilities in `/app/lib/firebaseConfig.ts` with context providers in `/context/`
- Type definitions in `/types/` directory
- Path aliases defined in tsconfig.json for cleaner imports (e.g., @components, @lib)

# Prompt Engineering for Firestore Database Design and Security Rules

Below is the engineering prompt that outlines the design and security rules for a Firestore database for a web service aimed at divorced parents. The service’s primary functionality is sharing information about a child among multiple users (such as parents, guardians, grandparents, etc.) based on specific permission levels ("view" and "edit"). The tech stack is Next 15 and Firebase.

---

## Context

- **Tech Stack:** Next 15 and Firebase.
- **Primary Feature:** Sharing information related to a child.
- **User Permissions:** Two levels – "view" and "edit".
- **Collaboration:** The system must support real-time collaborative editing, similar to Google Docs.
- **Expected Traffic:** Approximately 1000 daily accesses.

---

## Functional Requirements

1. **User Account and Child Association:**
   - Upon account creation, a user can add one or more children.
   - During child registration, the user may select additional users (from their friend list) to be related to the child. For each selected user, a role (e.g., mother, godparent, guardian, grandparent, etc.) and a permission level ("view" or "edit") are assigned.

2. **Functionalities for Users with Edit Permissions:**
   - Create events on a calendar associated with the child.
   - Create expense groups associated with the child.
   - Display the child on their profile.

3. **Data Access and Visibility:**
   - All users linked to the child can view or edit items according to their permissions.
   - Events can be private (only visible to the creator) or shared (visible to all authorized users by default).
   - Expense groups have access rules defined at creation (either shared or private to the creator).

4. **Responsibility Management:**
   - The user who originally created the child can cease to be responsible if their account is deleted.

5. **Scalability and Collaboration:**
   - The design should be efficient for the expected traffic (≈1000 accesses/day).
   - It must support real-time collaboration, allowing multiple users to edit content simultaneously.

---

## Data Model (Schema)

### 1. **Collection: `users`**
- **Purpose:** Store user profiles.
- **Document Path:** `users/{userId}`
- **Fields:**
  - Basic user information (e.g., name, email, etc.).
  - *(Optional)* An array of child IDs to facilitate queries.

### 2. **Collection: `children`**
- **Purpose:** Each document represents a child and acts as the central node for related data.
- **Document Path:** `children/{childId}`
- **Fields:**
  - Child data (e.g., name, birth date, etc.).
  - **Permissions:**  
    - *Option 1:* A map (e.g., `roles`) that maps each user UID to a permission level (`"viewer"` or `"editor"`).  
    - *Option 2:* Two separate arrays: `viewers` and `editors`.

### 3. **Subcollection: `events`**
- **Purpose:** Store events related to the child.
- **Document Path:** `children/{childId}/events/{eventId}`
- **Fields:**
  - `title`, `description`, `date`
  - `createdBy`: UID of the user who created the event.
  - `isPrivate`: Boolean flag indicating if the event is private (only visible to the creator) or shared (visible to all users linked to the child).

### 4. **Subcollection: `expenseGroups`**
- **Purpose:** Store groups of expenses related to the child.
- **Document Path:** `children/{childId}/expenseGroups/{groupId}`
- **Fields:**
  - Group details (e.g., name, category, description).
  - `createdBy`: UID of the user who created the group.
  - **Access Rules:**  
    - *Option 1:* A boolean `isShared` flag indicating if the group is shared with all authorized users.  
    - *Option 2:* An array `members` listing the UIDs that are allowed access.
- **Optional:** A nested subcollection (e.g., `expenses`) to store individual expense items.

---

## Security Rules for Firestore

### Global Rule: Authentication Requirement

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Ensure all operations are performed by authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}