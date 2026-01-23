# System Architecture Diagram

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCER WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────┘

    Producer
        ↓
    [Create Team]
        ↓
    ProductionTeam Created + Team Members Added
        ↓
    [Create Project in Team]
        ↓
    FilmProject Created + Notifications sent to Team
        ↓
    [Define Roles in Project]
        ↓
    Roles Array Updated + Notifications sent to Team
        ↓
    [Create Casting from Role]
        ↓
    CastingCall Created (auto-filled from role) + Notifications sent
        ↓
    Casting visible on Public /casting page + Team /casting/team/:id
        ↓
    [Manage Casting Submissions]
        ↓
    Applications appear in /dashboard/producer
        ↓
    Accept/Reject/Shortlist Applications

┌─────────────────────────────────────────────────────────────────────┐
│                          ACTOR WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

    Actor
        ↓
    [Browse Castings]
        ↓
    GET /casting (all active castings)
        ↓
    Filter by: experience, gender, location, age
        ↓
    [View Casting Details]
        ↓
    Show: Role title, Project name, Requirements, Producer info
        ↓
    [Apply for Casting]
        ↓
    POST /audition/submit/:castingId
        ↓
    Application saved with videos & details
        ↓
    Application appears in Producer's submissions

┌─────────────────────────────────────────────────────────────────────┐
│                      TEAM MEMBER WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────┘

    Team Member
        ↓
    [Accept Team Invitation]
        ↓
    Added to ProductionTeam.members array
        ↓
    [View Team Projects]
        ↓
    GET /projects?teamId=xyz
        ↓
    See all projects created by team
        ↓
    [View Team Roles]
        ↓
    Click project to see all roles
        ↓
    [View Team Castings]
        ↓
    Click "My Team Castings" on /casting page
        ↓
    GET /casting/team/:teamId
        ↓
    See all castings for team's projects
        ↓
    [Receive Notifications]
        ↓
    New project, roles, castings appear in notification bell
```

---

## Database Schema Relationships

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ _id              │
│ name             │
│ email            │
│ role             │
└──────────────────┘
        ↓
        ├─────────────────────┐
        ↓                     ↓
┌──────────────────┐  ┌──────────────────────┐
│ ProductionTeam   │  │   FilmProject        │
├──────────────────┤  ├──────────────────────┤
│ _id              │  │ _id                  │
│ owner: User ────────→ createdBy: User    │
│ members[]        │  │ team: ProductionTeam │
│ name             │  │ name                 │
│ description      │  │ genre                │
└──────────────────┘  │ language             │
        ↓             │ location             │
        │             │ startDate            │
        │             │ endDate              │
        ↓             │ roles: [RoleSchema]  │
┌──────────────────────────────────┐  │
│  TeamInvitation                  │  │
├──────────────────────────────────┤  │
│ _id                              │  │
│ team: ProductionTeam ────────────┘  │
│ invitee: User                       │
│ role                                │
│ status                              │
└──────────────────────────────────┘
                                       │
                                       ↓
                        ┌──────────────────────────────┐
                        │      RoleSchema (Embedded)   │
                        ├──────────────────────────────┤
                        │ _id                          │
                        │ roleName                     │
                        │ roleType                     │
                        │ ageMin, ageMax               │
                        │ gender                       │
                        │ skillsRequired: [String]     │
                        │ experienceLevel              │
                        │ numberOfOpenings             │
                        │ castingCallId: CastingCall   │
                        └──────────────────────────────┘
                                    ↓
                        ┌──────────────────────┐
                        │  CastingCall         │
                        ├──────────────────────┤
                        │ _id                  │
                        │ roleTitle            │
                        │ description          │
                        │ producer: User       │
                        │ project: FilmProject │
                        │ projectRole: RoleId  │
                        │ team: ProductionTeam │
                        │ ageRange             │
                        │ genderRequirement    │
                        │ experienceLevel      │
                        │ skills: [String]     │
                        │ auditionDate         │
                        │ submissionDeadline   │
                        └──────────────────────┘
                                    ↓
                        ┌──────────────────────┐
                        │ Video (Application)  │
                        ├──────────────────────┤
                        │ _id                  │
                        │ castingCall          │
                        │ actor: User          │
                        │ videoUrl             │
                        │ status               │
                        │ qualityAssessment    │
                        └──────────────────────┘
```

---

## Request-Response Flows

### Flow 1: Create Casting from Role

```
Frontend (ProjectDetails)
    │
    ├─ User clicks "Create Casting" on role
    │
    ├─ Dialog shows: description, dates, location
    │
    └─ POST /projects/:id/roles/:roleId/casting
            │
            │ Request Body:
            │ {
            │   roleId: "role_xyz",
            │   castingData: {
            │     description: "...",
            │     auditionDate: "2024-02-15T10:00:00",
            │     submissionDeadline: "2024-02-10T18:00:00",
            │     location: "Mumbai"
            │   }
            │ }
            │
            ↓
        Backend (projects.js)
            │
            ├─ Verify team membership
            │
            ├─ Find project and role
            │
            ├─ Create CastingCall with:
            │  • roleTitle from role.roleName
            │  • ageRange from role.ageMin/Max
            │  • genderRequirement from role.gender
            │  • skills from role.skillsRequired
            │  • producer from req.user._id
            │  • project from project._id
            │  • projectRole from role._id
            │  • team from project.team._id
            │
            ├─ Update role.castingCallId
            │
            ├─ Save project
            │
            ├─ Notify all team members
            │
            └─ Return 201 { success: true, data: castingCall }
                    │
                    ↓
        Frontend
            │
            ├─ Show success toast
            │
            ├─ Close dialog
            │
            ├─ Refresh project query
            │
            └─ Show "Casting Created" badge on role
```

### Flow 2: Team Members View Castings

```
Frontend (CastingList)
    │
    ├─ User clicks "My Team Castings"
    │
    ├─ For each team, fetch castings:
    │  └─ GET /casting/team/:teamId
    │
    └─────────────────────────────────────┐
                                          │
        Backend (casting.js)              │
            │                             │
            ├─ Verify team membership     │
            │                             │
            ├─ Query CastingCall where:   │
            │  • team: teamId             │
            │                             │
            ├─ Populate:                  │
            │  • producer info            │
            │  • project info             │
            │                             │
            ├─ Sort by createdAt desc     │
            │                             │
            └─ Return 200 { success: true, count: 5, data: [...] }
                        │
                        ↓
        Frontend
            │
            ├─ Render casting cards
            │
            ├─ Show:
            │  • Role title
            │  • Project name [NEW]
            │  • Producer name
            │  • Experience level
            │  • Submission deadline
            │
            └─ "Apply" button available
```

### Flow 3: Notification Broadcast

```
Backend (projects.js)
    │
    ├─ Create/Update/Add role to project
    │
    ├─ Get all team members:
    │  • team.owner
    │  • team.members.map(m => m.user)
    │
    ├─ Filter out current user (creator)
    │
    ├─ For each team member:
    │  └─ await createNotification({
    │       user: memberId,
    │       title: "...",
    │       message: "...",
    │       type: "project|role|casting",
    │       relatedId: objectId,
    │       relatedType: "film-project|casting-call"
    │     })
    │
    ├─ createNotification (notificationService.js)
    │  │
    │  ├─ Save to Database
    │  │
    │  ├─ Check if socket emitter exists
    │  │
    │  └─ Emit via socket to user:
    │     io.to(userId).emit('notification', {notification})
    │
    └─ Frontend receives notification
        │
        ├─ Play notification sound
        │
        ├─ Update notification bell icon
        │
        ├─ Show toast or notification panel
        │
        └─ User can click to view related object
```

---

## Component Hierarchy

```
App
├─ Router
│  ├─ /projects
│  │  └─ Projects.jsx (List projects)
│  │
│  ├─ /projects/:id
│  │  └─ ProjectDetails.jsx [NEW]
│  │     ├─ Project info card
│  │     ├─ Roles section
│  │     │  ├─ Role list
│  │     │  │  └─ Each role with "Create Casting" button
│  │     │  └─ "Add Role" button
│  │     ├─ AddRole Dialog [NEW]
│  │     │  ├─ Role name input
│  │     │  ├─ Type select
│  │     │  ├─ Age range inputs
│  │     │  ├─ Skills input
│  │     │  └─ Submit button
│  │     └─ CreateCasting Dialog [NEW]
│  │        ├─ Description textarea
│  │        ├─ Date pickers
│  │        ├─ Location input
│  │        └─ Submit button
│  │
│  ├─ /casting
│  │  └─ CastingList.jsx [MODIFIED]
│  │     ├─ Search input
│  │     ├─ Filter selects
│  │     ├─ "My Team Castings" button [NEW]
│  │     └─ Casting cards
│  │        └─ Show project name [NEW]
│  │
│  ├─ /casting/:id
│  │  └─ CastingDetails.jsx
│  │     ├─ Role info
│  │     ├─ Project info [NEW]
│  │     ├─ Producer info
│  │     ├─ Requirements
│  │     └─ Apply button
│  │
│  ├─ /audition/submit/:castingId
│  │  └─ AuditionSubmit.jsx
│  │     ├─ Casting info
│  │     ├─ Project info [NEW]
│  │     ├─ Video upload
│  │     └─ Actor details form
│  │
│  ├─ /dashboard/producer
│  │  └─ ProducerDashboard.jsx
│  │     ├─ Casting calls list
│  │     └─ Submissions dialog
│  │        ├─ Video player
│  │        ├─ Applicant details
│  │        ├─ Sort dropdown
│  │        └─ Status update buttons
│  │
│  └─ /teams
│     └─ Teams.jsx
│        ├─ Team list
│        ├─ Team creation dialog
│        ├─ Team details
│        ├─ Member list
│        ├─ Invite dialog
│        └─ Manage roles
```

---

## State Management Flow

```
ProjectDetails Component

    useQuery('project')
        │
        ├─ Fetch: GET /projects/:id
        ├─ Populate: team, createdBy, collaborators
        └─ Update on mount, invalidate on role/casting create

    State:
    ├─ showAddRole: boolean
    ├─ showCreateCasting: boolean
    ├─ selectedRole: Role object
    ├─ roleForm: {roleName, roleType, ageMin, ageMax, ...}
    └─ castingForm: {description, auditionDate, ...}

    useMutation('addRole')
        │
        └─ POST /projects/:id/roles
           └─ Invalidate: useQuery('project')

    useMutation('createCasting')
        │
        └─ POST /projects/:id/roles/:roleId/casting
           └─ Invalidate: useQuery('project')

CastingList Component

    useQuery('casting')
        │
        └─ Fetch: GET /casting

    useQuery('teams')
        │
        └─ Fetch: GET /teams (if user is producer)

    State:
    ├─ query: string (search)
    ├─ filters: {experienceLevel, genderRequirement, location, age}
    ├─ castings: [CastingCall]
    ├─ showTeamCastings: boolean
    └─ userTeams: [ProductionTeam]

    Computed:
    └─ filtered = castings.filter(matches search + filters)
```

---

## Authentication & Authorization Flow

```
Protected Route
    │
    └─ middleware/auth.js
        │
        ├─ protect middleware
        │  ├─ Check JWT token
        │  └─ Attach req.user
        │
        └─ authorize middleware
           ├─ Check user.role in allowed roles
           └─ Return 403 if not authorized

Project Routes
    │
    ├─ POST /projects
    │  ├─ protect ✓
    │  ├─ authorize('Producer', 'ProductionTeam', 'Admin') ✓
    │  └─ Verify team membership ✓
    │
    ├─ POST /projects/:id/roles
    │  ├─ protect ✓
    │  ├─ authorize('Producer', 'ProductionTeam', 'Admin') ✓
    │  └─ Verify team membership ✓
    │
    └─ POST /projects/:id/roles/:roleId/casting
       ├─ protect ✓
       ├─ authorize('Producer', 'ProductionTeam', 'Admin') ✓
       └─ Verify team membership ✓

Casting Routes
    │
    ├─ GET /casting (PUBLIC - NO AUTH)
    │
    ├─ GET /casting/team/:teamId
    │  ├─ protect ✓
    │  └─ Verify team membership ✓
    │
    └─ POST /casting
       ├─ protect ✓
       └─ authorize('Producer', 'ProductionTeam') ✓
```

---

## Timeline & Notification System

```
Timeline:
    │
    T1 ─ Producer creates project
    │    └─ Notification: "New project created"
    │       └─ Sent to: team.owner, team.members
    │
    T2 ─ Producer adds first role (Lead Actor)
    │    └─ Notification: "New role added - Lead Actor"
    │       └─ Sent to: team members
    │
    T3 ─ Producer adds second role (Villain)
    │    └─ Notification: "New role added - Villain"
    │       └─ Sent to: team members
    │
    T4 ─ Producer creates casting from Lead role
    │    └─ Notification: "Casting posted - Lead Actor"
    │       └─ Sent to: team members + visible on public /casting
    │
    T5 ─ Producer creates casting from Villain role
    │    └─ Notification: "Casting posted - Villain"
    │       └─ Sent to: team members + visible on public /casting
    │
    T6 ─ Actor 1 applies for Villain casting
    │    └─ Application saved, appears in producer dashboard
    │
    T7 ─ Actor 2 applies for Lead casting
    │    └─ Application saved, appears in producer dashboard
    │
    T8 ─ Producer reviews applications
    │    └─ Updates status: Accepted/Rejected/Pending
    │
    T9 ─ Producer schedules callbacks
    │    └─ Selected actors notified

Notification Types:
├─ "project" - Project creation/update
├─ "role" - Role addition/update
├─ "casting" - Casting creation
└─ "application" - Actor applied (future feature)
```

---

## Error Handling Flow

```
User Action
    │
    └─ API Request
        │
        ├─ Validation Error
        │  ├─ Return 400
        │  ├─ Message: "Field validation failed"
        │  └─ Frontend: Show error toast
        │
        ├─ Authorization Error
        │  ├─ Return 403
        │  ├─ Message: "Not authorized"
        │  └─ Frontend: Redirect to login
        │
        ├─ Not Found Error
        │  ├─ Return 404
        │  ├─ Message: "Resource not found"
        │  └─ Frontend: Show 404 page
        │
        ├─ Server Error
        │  ├─ Return 500
        │  ├─ Message: "Internal server error"
        │  └─ Frontend: Show error toast
        │
        └─ Success
           ├─ Return 200/201
           ├─ Data: {...}
           └─ Frontend: Update state, show success toast
```

