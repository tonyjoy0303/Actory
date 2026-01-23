# Actory - Complete Architecture Analysis
## Project Creation, Team Creation & Castings System

---

## 📊 System Overview

**Actory** is a MERN stack casting platform that connects actors with production houses for film/video projects. The system has three core features:
1. **Teams** - Production teams manage casting calls
2. **Projects** - Film/video projects linked to teams
3. **Castings** - Casting calls for specific roles within projects

---

## 🗂️ Data Model Relationships

### Entity Relationship Diagram

```
User
├── Producer (role='Producer')
├── ProductionTeam member (role='ProductionTeam')
└── Actor (role='Actor')

ProductionTeam
├── owner: User (ObjectId)
├── members: Array[MemberSchema]
│   ├── user: User (ObjectId)
│   ├── role: 'Owner' | 'Recruiter' | 'Viewer'
│   └── addedAt: Date
├── name: String
├── productionHouse: String
└── description: String

FilmProject
├── team: ProductionTeam (ObjectId) ✓ REQUIRED
├── createdBy: User (ObjectId) ✓ REQUIRED
├── collaborators: Array[User] (ObjectId)
├── name: String ✓ REQUIRED
├── genre: String
├── language: String
├── location: String
├── startDate: Date
├── endDate: Date
├── description: String
└── status: 'draft' | 'active' | 'archived'

CastingCall
├── producer: User (ObjectId) ✓ REQUIRED
├── roleTitle: String ✓ REQUIRED
├── description: String ✓ REQUIRED
├── ageRange: { min, max } ✓ REQUIRED
├── heightRange: { min, max } OPTIONAL
├── genderRequirement: 'male' | 'female' | 'any' | 'other' ✓ REQUIRED
├── experienceLevel: 'beginner' | 'intermediate' | 'professional' ✓ REQUIRED
├── location: String ✓ REQUIRED
├── numberOfOpenings: Number ✓ REQUIRED
├── skills: Array[String] ✓ REQUIRED (min 1)
├── auditionDate: Date ✓ REQUIRED
├── submissionDeadline: Date ✓ REQUIRED
├── shootStartDate: Date ✓ REQUIRED
├── shootEndDate: Date ✓ REQUIRED
└── createdAt: Date

TeamInvitation
├── team: ProductionTeam (ObjectId) ✓ REQUIRED
├── invitedBy: User (ObjectId) ✓ REQUIRED
├── invitee: User (ObjectId) ✓ REQUIRED
├── project: FilmProject (ObjectId) OPTIONAL
├── role: 'Recruiter' | 'Viewer'
├── status: 'pending' | 'accepted' | 'rejected' | 'expired'
├── token: String (unique, for link-based invites)
└── expiresAt: Date ✓ REQUIRED
```

### Key Relationships
- **Team Creation**: User (Producer/ProductionTeam) → owns ProductionTeam
- **Project Creation**: ProductionTeam ← has many FilmProject; User ← creates FilmProject
- **Casting Creation**: User (Producer) → creates CastingCall
- **Team Members**: ProductionTeam → has many Users via members array

---

## 🔗 API Endpoints

### Teams API
```
POST   /api/v1/teams                    Create team
GET    /api/v1/teams                    Get all teams for current user
GET    /api/v1/teams/:id                Get team details
PUT    /api/v1/teams/:id                Update team
DELETE /api/v1/teams/:id/members/:memberId  Remove member from team
POST   /api/v1/teams/:id/leave          User leaves team
```

**Authorization**: `protect`, `authorize('Producer', 'ProductionTeam', 'Admin')`

### Projects API
```
POST   /api/v1/projects                 Create project
GET    /api/v1/projects                 Get projects (filtered by team query param)
GET    /api/v1/projects/:id             Get project details
```

**Authorization**: `protect`, `authorize('Producer', 'ProductionTeam', 'Admin')`

**Query Parameters**:
- `?teamId=<id>` - Filter projects by team

### Casting API
```
GET    /api/v1/casting                  Get all active casting calls (PUBLIC)
GET    /api/v1/casting/producer         Get casting calls for logged-in producer
GET    /api/v1/casting/:id              Get specific casting call details
POST   /api/v1/casting                  Create new casting call
PUT    /api/v1/casting/:id              Update casting call
DELETE /api/v1/casting/:id              Delete casting call
```

**Authorization**:
- `GET /casting` - PUBLIC (no auth required)
- `POST, PUT, DELETE` - `protect`, `authorize('Producer', 'ProductionTeam')`
- `GET /casting/producer` - `protect`, `authorize('Producer', 'ProductionTeam')`

---

## 📝 Backend Controllers Logic

### 1. Teams Controller (`teams.js`)
**Key Functions**:
- `createTeam(req, res)` - Creates new team with user as owner
- `getMyTeams(req, res)` - Returns all teams where user is owner or member
- `getTeamById(req, res)` - Returns team with populated owner and members
- `updateTeam(req, res)` - Updates team details (owner only)
- `removeMember(req, res)` - Removes member from team (owner only)
- `leaveTeam(req, res)` - Member leaves team

**Business Logic**:
- Team owner is automatically added as 'Owner' role member
- Only owner can update team or remove members
- Helper function `isMember()` checks if user is owner or in members array
- Supports both User and ProductionHouse references (mixed refs)

### 2. Projects Controller (`projects.js`)
**Key Functions**:
- `createProject(req, res)` - Creates project linked to team
- `getProjects(req, res)` - Returns user's accessible projects
- `getProjectById(req, res)` - Returns project with populated data

**Business Logic**:
- **Required**: `teamId` and `name`
- Project creator becomes first collaborator
- User must be team member to create project
- Notifications sent to all team members when project created
- Project has status: 'draft', 'active', 'archived'

**Security**:
- Uses `isTeamMember()` to verify user has access to team
- Filters to show only teams user belongs to

### 3. Casting Controller (`casting.js`)
**Key Functions**:
- `getCastingCalls(req, res)` - Gets all active casting calls (PUBLIC)
- `getProducerCastingCalls(req, res)` - Gets casting calls by logged-in producer
- `getCastingCall(req, res)` - Gets specific casting call details
- `createCastingCall(req, res)` - Creates new casting call
- `updateCastingCall(req, res)` - Updates casting call
- `deleteCastingCall(req, res)` - Deletes casting call

**Validation Logic**:
```javascript
// Date validation order:
submissionDeadline < auditionDate < shootStartDate ≤ shootEndDate

// All dates must be in future
// Age range: min ≤ max (1-120 valid)
// Height range: optional but if provided, min ≤ max (50-300 cm valid)
// Skills: minimum 1 required
// numberOfOpenings: minimum 1
```

**Filtering** (for getCastingCalls):
- `?experienceLevel=` - Filter by experience level
- `?genderRequirement=` - Filter by gender
- `?location=` - Filter by location (regex, case-insensitive)
- `?producer=` - Filter by producer ID

---

## 💻 Frontend Architecture

### 1. Pages Structure

#### `/casting` Routes
- `CastingList.jsx` - Browse all active casting calls
  - Search by role, location, skills
  - Filter by experience, gender, location, age
  - Card view with submission deadline indicator
  
- `CreateCastingCall.jsx` - Create new casting call (Producer only)
  - Uses `CastingCallForm` component
  - Validates and submits to POST `/api/v1/casting`
  - Redirects to `/dashboard/producer` on success

- `EditCastingCall.jsx` - Edit existing casting call (Producer only)
  - Fetches casting call data
  - Pre-fills form with existing values
  - Submits to PUT `/api/v1/casting/:id`

- `CastingDetails.jsx` - View specific casting details
  - Shows producer name, requirements, dates
  - Apply button for actors → `/audition/submit/:castingCallId`

- `Submissions.jsx` - View casting submissions (Producer only)
  - Lists all actor submissions for a casting call
  - Shows audition quality assessment
  - Filter/sort by name, date, quality, status

#### `/dashboard/producer` Route
- `ProducerDashboard.jsx` - Main producer view
  - Lists all producer's casting calls
  - Shows submission count per casting
  - Dialog to view/manage submissions
  - Sorting options: date, name, quality, status, age, height

#### `/teams` Route
- `Teams.jsx` - Manage production teams
  - Create new team
  - View all teams user belongs to
  - View team members and roles
  - Invite new members to team
  - View team projects

#### `/projects` Route
- `Projects.jsx` - Manage film projects
  - Create project (linked to team)
  - Define roles within project
  - Set casting details
  - Track project status

### 2. Form Components

#### `CastingCallForm.jsx`
**Purpose**: Reusable form for creating/editing casting calls

**Form Fields**:
- Role Title (text, min 2 chars)
- Description (textarea, 10-500 chars)
- Age Range (min/max, 1-120)
- Height Range (optional, min/max, 50-300 cm)
- Gender Requirement (select: male, female, any, other)
- Experience Level (select: beginner, intermediate, professional)
- Location (text)
- Number of Openings (number, min 1)
- Skills (array with add/remove buttons)
- Audition Date (calendar picker)
- Submission Deadline (calendar picker)
- Shoot Start Date (calendar picker)
- Shoot End Date (calendar picker)

**Validation**: Uses Zod schema with React Hook Form
**State Management**: Controlled component with watch/setValue

---

## 🔄 User Workflows

### Workflow 1: Producer Creates Casting Call
```
1. Producer logs in → role: 'Producer' or 'ProductionTeam'
2. Navigate to /casting/new
3. Fill CastingCallForm with:
   - Role details
   - Requirements (age, gender, experience, skills)
   - Timeline (audition, submission deadline, shooting dates)
4. Submit form
5. POST /api/v1/casting with formatted data (dates as ISO strings)
6. Backend validates all fields and date logic
7. CastingCall created with producer as owner
8. Redirect to /dashboard/producer with success toast
```

### Workflow 2: Actor Browses & Applies for Casting
```
1. Actor (not logged in or logged in) navigates to /casting
2. CastingList component fetches GET /api/v1/casting
3. Display all active casting calls (future audition & submission dates)
4. Actor can:
   - Search by role/skills/location
   - Filter by experience level, gender requirement, location, age
5. Click casting card → navigate to /casting/:id (CastingDetails)
6. View all casting details and requirements
7. Click "Apply Now" → /audition/submit/:castingCallId
8. Submit audition video and personal details
```

### Workflow 3: Producer Creates Team & Project
```
1. Producer navigates to /teams
2. Create new team:
   - Name (required)
   - Production House (optional)
   - Description (optional)
3. POST /api/v1/teams creates ProductionTeam
4. Producer automatically becomes 'Owner'
5. Invite team members (other producers/recruiters)
6. Navigate to /projects
7. Create project:
   - Select team (required)
   - Project name, genre, language, location (required)
   - Start/end dates (optional)
   - Description (optional)
8. POST /api/v1/projects links project to team
9. Notifications sent to all team members
10. Can now create casting calls for project
```

### Workflow 4: Producer Manages Casting Submissions
```
1. Producer views /dashboard/producer
2. GET /api/v1/casting/producer fetches all producer's casting calls
3. Click "View Submissions" for a casting
4. GET /api/v1/casting/:castingCallId/videos fetches submissions
5. Submissions dialog shows:
   - Actor name, video, quality score
   - Status (Pending, Accepted, Rejected, etc.)
6. Can sort by: date, name, quality, status, age, height
7. Can update submission status
```

---

## 🎯 Key Features & Validations

### Casting Call Validations
1. **Date Logic**:
   - `submissionDeadline` < `auditionDate` < `shootStartDate` ≤ `shootEndDate`
   - All dates must be in the future
   - MongoDB schema enforces this via custom validators

2. **Requirements Validation**:
   - Age range: 1-120 (max ≥ min)
   - Height range: 50-300 cm (optional, max ≥ min)
   - Experience level: beginner, intermediate, professional
   - Gender: male, female, any, other
   - At least 1 skill required

3. **Business Rules**:
   - Only Producer/ProductionTeam can create casting calls
   - Producer is automatically set as casting call owner
   - Active casting calls shown publicly (future dates only)
   - Producers see ALL their casting calls (past and future)

### Team Management
1. **Roles**:
   - Owner: Can update team, remove members, invite users
   - Recruiter: Can create projects and casting calls
   - Viewer: View-only access

2. **Member Management**:
   - Owner invites users via TeamInvitation
   - Invitations have expiry time and unique tokens
   - Can accept/reject invitations

3. **Project Permissions**:
   - Only team members can access projects
   - Project creator becomes first collaborator
   - All team members notified of new projects

---

## 📂 File Organization Summary

### Backend Files
```
actory-spotlight-backend/
├── models/
│   ├── FilmProject.js          (Project data model)
│   ├── ProductionTeam.js       (Team data model)
│   ├── CastingCall.js          (Casting call model)
│   ├── TeamInvitation.js       (Team invitations)
│   └── User.js                 (User model)
├── controllers/
│   ├── projects.js             (Project logic)
│   ├── teams.js                (Team logic)
│   ├── casting.js              (Casting call logic)
│   └── teamInvitations.js      (Invitation logic)
├── routes/
│   ├── projects.js             (Project endpoints)
│   ├── teams.js                (Team endpoints)
│   ├── casting.js              (Casting endpoints)
│   └── teamInvitations.js      (Invitation endpoints)
└── middleware/
    └── auth.js                 (protect, authorize)
```

### Frontend Files
```
actory-spotlight-ui/src/
├── pages/
│   ├── casting/
│   │   ├── CreateCastingCall.jsx
│   │   ├── EditCastingCall.jsx
│   │   ├── CastingDetails.jsx
│   │   └── Submissions.jsx
│   ├── CastingList.jsx         (Browse all castings)
│   ├── ProducerDashboard.jsx   (Producer main dashboard)
│   ├── Projects.jsx            (Project management)
│   ├── Teams.jsx               (Team management)
│   └── AuditionSubmit.jsx      (Actor applies for casting)
└── components/
    └── CastingCallForm.jsx     (Reusable casting form)
```

### Test Files
```
actory-spotlight-ui/tests/
├── casting-call.spec.ts        (Casting CRUD tests)
├── casting-workflow.spec.ts    (End-to-end workflow tests)
├── producer-casting.spec.ts    (Producer-specific tests)
└── application-workflow.spec.ts (Full application flow)
```

---

## 🔐 Authentication & Authorization

### Protected Routes
All CRUD operations require:
```javascript
router.use(protect, authorize('Producer', 'ProductionTeam', 'Admin'))
```

### Public Routes
- `GET /casting` - Anyone can browse casting calls
- `GET /casting/:id` - Anyone can view casting details

### Private Routes (Auth Required)
- `GET /casting/producer` - Producer only (their own castings)
- `POST/PUT/DELETE /casting` - Producer only
- All team routes - Producer/ProductionTeam only
- All project routes - Producer/ProductionTeam only

---

## 🚀 Data Flow Examples

### Creating a Casting Call - Complete Flow
```
Frontend: CreateCastingCall.jsx
  ↓
  User fills CastingCallForm
  ↓
  Form validates with Zod schema
  ↓
  handleSubmit(data) called
  ↓
  Format dates: new Date() → toISOString()
  ↓
  POST /api/v1/casting { roleTitle, description, ageRange, ... }
  ↓
Backend: castingController.createCastingCall()
  ↓
  Validate all required fields
  ↓
  Validate date logic
  ↓
  CastingCall.create({ ...data, producer: req.user.id })
  ↓
  Save to MongoDB
  ↓
  Return: { success: true, data: castingCall }
  ↓
Frontend: 
  ↓
  Show success toast
  ↓
  setTimeout(500ms) → navigate('/dashboard/producer')
```

### Filtering Casting Calls - Data Flow
```
Frontend: CastingList.jsx
  ↓
  useEffect: GET /api/v1/casting
  ↓
Backend: castingController.getCastingCalls()
  ↓
  Build query: { auditionDate: {$gte: now}, submissionDeadline: {$gte: now} }
  ↓
  Apply filters: experienceLevel, genderRequirement, location
  ↓
  .populate('producer', 'name email')
  ↓
  .sort({ submissionDeadline: 1 })
  ↓
  Return array of casting calls
  ↓
Frontend: 
  ↓
  setCastings(data)
  ↓
  useMemo filters by: search query + age/experience/gender/location
  ↓
  Render filtered casting cards
```

---

## 💡 Important Implementation Notes

1. **Date Handling**:
   - Frontend: Uses `date-fns` for parsing and formatting
   - Convert to ISO string before API call: `date.toISOString()`
   - Backend: Stores as Date in MongoDB, validates against current time

2. **Skills Array**:
   - CastingCallForm: Manual add/remove with input + button
   - Minimum 1 skill required
   - Submitted as array to API

3. **Filtering**:
   - Backend: Database level (MongoDB queries)
   - Frontend: JavaScript useMemo for client-side filtering
   - Case-insensitive location search uses regex

4. **Producer ID**:
   - Automatically set from `req.user.id` in controller
   - Not passed from frontend (security)
   - Used to filter producer's own casting calls

5. **Team Authorization**:
   - Check `isTeamMember()` before allowing operations
   - Handles both owner and member roles
   - Supports mixed references (User + ProductionHouse)

6. **Error Handling**:
   - Form validation: Zod + React Hook Form
   - API errors: Caught in try-catch, displayed as toast
   - Backend validation: Mongoose schema validators

---

## 📊 Database Indexes

**ProductionTeam**:
- `owner` - For querying user's teams
- `members.user` - For finding teams by member

**FilmProject**:
- `team` - For finding projects by team
- `collaborators` - For finding projects by collaborator

**TeamInvitation**:
- `invitee, status` - For finding pending invitations
- `team, status` - For team-specific invitations

**CastingCall**:
- Indexed by producer, auditionDate for efficient queries

---

## ✅ Summary

The system is a well-structured casting platform where:
- **Producers** create teams and manage casting calls
- **Teams** organize multiple producers/recruiters
- **Projects** link teams to specific film/video productions
- **Casting Calls** define specific roles with detailed requirements
- **Actors** browse active castings and submit auditions
- **Dates** are strictly validated in sequence
- **Security** is enforced via role-based authorization
- **Notifications** alert team members of changes

