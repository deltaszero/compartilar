# CompartiLar - Co-Parenting Platform

CompartiLar is a modern web application built to help parents coordinate, communicate, and collaborate on childcare responsibilities. The platform provides tools for managing shared calendars, expenses, child profiles, and communication.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Firebase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/compartilar.git
   cd compartilar
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the project root and add the following Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Features

- **User Authentication**: Secure login and registration with email or Google
- **Child Profiles**: Create and manage profiles for children with permissions control
- **Shared Calendar**: Coordinate schedules and events between co-parents
- **Expense Tracking**: Track and split childcare expenses
- **Check-in System**: Location-based check-ins for handoffs and visits
- **Permission Model**: Fine-grained access control with viewer/editor permissions

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI with Neobrutalism theme
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **Deployment**: Firebase Hosting

## Firebase Rules

The application uses a permission-based security model with:

- Viewer/editor access control for child data
- Private/shared events and expense groups
- User-specific data protection

## Development Commands

See `CLAUDE.md` file for development commands and code style guidelines.

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add some amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request


# Development Snippets

```sh
npm run export:admin -- --key=/home/dusoudeth/Downloads/compartilar-firebase-app-firebase-adminsdk-7yjqp-4c09ff6f0e.json --output=/home/dusoudeth/Documentos/github/compartilar/temp/admin-export.json
```


```error
in /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano/README.md there is a draft for a parental plan form

in terms of frontend the structure i have in mind is

+ at /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano, there is a page with as many parental plans the user created
+ when the user clicks, it opens a beautiful form like the draft

in terms of backend

+ create a collection called parental_plan, each document will be a parental plan created by users
+ each parental plan MUST obligatory be linked to one or more kid
+ CRUD operations should be viewed and edited accordingly to editors and viewers of the kid linked to it
+ changes in parental plan should be logged in a subcollection called changelog and must contain timestamp and changed fields before and after


your implementation should be modular, so first create the general structure and add only "1. Educação Regular"

```