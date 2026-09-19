# NodeWave PM — Frontend

A clean, modern project management interface built with Next.js 16, TanStack Query, and Zustand. Designed following NodeWave brand guidelines.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand 5
- **Data Fetching**: TanStack Query 5 + Axios
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js >= 20
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MenaraWas/nw-frontend.git
cd nw-frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_BE_URL=https://nwbackend-production.up.railway.app
```

For local development, point to your local backend:

```env
NEXT_PUBLIC_BE_URL=http://localhost:3000
```

### Running the App

```bash
# Development
npm run dev

# Build for production
npm run build
npm start
```

App runs on `http://localhost:3000`

## Features

### Role-Based Views

**PM (Product Manager)**
- Create and manage projects
- Create tasks with dependencies
- Assign tasks to team members
- Manage project members (add/remove/reassign)
- Move tasks from TODO to IN_PROGRESS
- Edit task descriptions

**Internal Team (UI/UX, Frontend, Backend)**
- View assigned projects
- Move tasks from IN_PROGRESS to DONE
- Upload task attachments
- View task details and audit trail

**Client Guest**
- View project progress (percentage)
- View client-visible tasks only
- No internal team information visible

### Kanban Board
4-column board (TODO, IN PROGRESS, DONE, BLOCKED) with real-time status updates, dependency indicators, and role-based action buttons.

### Task Detail Modal
Click any task card to open a detail modal with:
- Full task information
- Dependency status with visual indicators
- Edit description (PM only)
- Upload attachment (Internal only)
- Attachment history
- Recent activity audit log

### Manage Members
PM can add and remove project members. Removing a member with active tasks prompts a reassignment flow before removal is allowed.

### Filtering & Pagination
Projects dashboard supports real-time search and pagination with 9 items per page.

## Project Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── dashboard/
│   │   ├── page.tsx              # Projects list
│   │   └── projects/
│   │       ├── create/
│   │       │   └── page.tsx      # Create project
│   │       └── [id]/
│   │           ├── page.tsx      # Kanban board
│   │           ├── members/
│   │           │   └── page.tsx  # Manage members
│   │           └── tasks/
│   │               └── create/
│   │                   └── page.tsx # Create task
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root redirect
│   └── providers.tsx             # Query + Auth providers
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   └── TaskModal.tsx         # Task detail modal
│   └── ui/                       # shadcn/ui components
├── hooks/
│   └── useAuth.ts                # Auth guard hook
├── lib/
│   └── api.ts                    # Axios instance with interceptors
├── store/
│   └── auth.ts                   # Zustand auth store
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Authentication Flow

1. User submits login form
2. API returns JWT token + user data
3. Token stored in localStorage via Zustand
4. Axios interceptor attaches token to every request
5. 401 response triggers automatic logout and redirect

## Deployment

Deployed on [Vercel](https://vercel.com).

**Live URL**: `https://nw-frontend-nine.vercel.app`

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| PM | pm@nodewave.com | admin123 |
| UI/UX | uiux@nodewave.com | password123 |
| Frontend | frontend@nodewave.com | password123 |
| Backend | backend@nodewave.com | password123 |
| Client | client@nodewave.com | password123 |

## License

Private — NodeWave Assessment Project