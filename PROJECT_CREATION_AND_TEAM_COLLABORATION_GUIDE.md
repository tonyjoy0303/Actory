# Project Creation & Team Collaboration Guide

## Overview

Actory is an entertainment industry platform that enables **Production Houses** and **Recruiters** to manage projects and collaborate with teams to create casting calls and recruit actors.

---

## 1. User Roles & Permissions

### Role Types in the System

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ROLES                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Producer/ProductionTeam                                   │
│    • Can create teams and projects                           │
│    • Can invite members to teams                            │
│    • Can manage casting calls                               │
│    • Can review actor applications                          │
│                                                              │
│ 2. Recruiter (Team Member)                                  │
│    • Invited to join teams                                  │
│    • Can participate in project management                  │
│    • Can view and manage casting calls (team-scoped)        │
│    • Full collaboration within team                         │
│                                                              │
│ 3. Viewer (Team Member)                                     │
│    • Read-only access to team resources                     │
│    • Cannot create projects or manage castings              │
│    • Can view team projects and casting calls               │
│                                                              │
│ 4. Actor/User (General)                                     │
│    • Browse public casting calls                            │
│    • Submit applications to casting calls                   │
│    • View their own applications                            │
│    • Upload profile videos                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Data Models

### 2.1 ProductionTeam Model

**Purpose**: Container for collaboration between production professionals

```javascript
{
  _id: ObjectId,
  name: String,                    // Team name (e.g., "XYZ Productions Team A")
  productionHouse: String,         // Associated production house name
  description: String,             // Team description
  owner: Reference(User),          // Team owner/creator
  members: [
    {
      user: Reference(User),       // Team member reference
      role: Enum['Owner', 'Recruiter', 'Viewer'],  // Member's role
      addedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Key Points**:
- Every team has an **Owner** (creator)
- Members can have different roles: `Owner`, `Recruiter`, or `Viewer`
- Owner can manage team members and projects
- Members are added via **Team Invitations**

---

### 2.2 FilmProject Model

**Purpose**: Represents a film/production project managed by a team

```javascript
{
  _id: ObjectId,
  team: Reference(ProductionTeam),     // Parent team
  name: String,                        // Project name
  genre: String,                       // Genre (e.g., Action, Drama)
  language: String,                    // Language (e.g., English, Hindi)
  location: String,                    // Shooting location
  startDate: Date,                     // Project start date
  endDate: Date,                       // Project end date
  description: String,                 // Project description (max 800 chars)
  createdBy: Reference(User),          // Project creator
  collaborators: [Reference(User)],    // List of collaborating team members
  
  roles: [
    {
      roleName: String,                // e.g., "Lead Hero", "Villain"
      roleType: Enum['Lead', 'Supporting', 'Guest', 'Extra'],
      ageMin: Number,                  // Minimum age requirement
      ageMax: Number,                  // Maximum age requirement
      gender: Enum['Male', 'Female', 'Any'],
      physicalTraits: String,          // Description of physical requirements
      skillsRequired: [String],        // Array of required skills
      experienceLevel: Enum['Beginner', 'Intermediate', 'Professional'],
      roleDescription: String,         // Detailed role description
      numberOfOpenings: Number,        // Number of positions available
      castingCallId: Reference(CastingCall)  // Link to created casting
    }
  ],
  
  status: Enum['draft', 'active', 'archived'],
  createdAt: Date,
  updatedAt: Date
}
```

**Status Flow**:
```
Draft → Active → Archived
```

---

### 2.3 TeamInvitation Model

**Purpose**: Manages team membership invitations

```javascript
{
  _id: ObjectId,
  team: Reference(ProductionTeam),     // Team being invited to
  invitedBy: Reference(User),          // Person sending invitation
  invitee: Reference(User),            // Person being invited
  project: Reference(FilmProject),     // Optional: specific project invite
  
  role: Enum['Recruiter', 'Viewer'],   // Role being offered
  status: Enum['pending', 'accepted', 'rejected', 'expired'],
  
  token: String,                       // Unique invitation token
  expiresAt: Date,                     // Invitation expiration (48 hours)
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.4 CastingCall Model

**Purpose**: Casting opportunity for a specific role

```javascript
{
  _id: ObjectId,
  project: Reference(FilmProject),
  team: Reference(ProductionTeam),
  producer: Reference(User),           // Casting creator
  roleTitle: String,                   // Role name
  description: String,                 // Role description
  
  ageRange: {
    min: Number,
    max: Number
  },
  
  genderRequirement: Enum['male', 'female', 'any'],
  experienceLevel: Enum['beginner', 'intermediate', 'professional'],
  skillsRequired: [String],            // Skills array
  location: String,
  numberOfOpenings: Number,
  
  submissionDeadline: Date,            // When submissions close
  auditionDate: Date,                  // When auditions happen
  shootStartDate: Date,                // Project shoot start
  shootEndDate: Date,                  // Project shoot end
  
  status: Enum['open', 'closed', 'filled'],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Complete Project Creation Flow

### 3.1 User Creates Team

**Endpoint**: `POST /api/v1/teams`
**Auth**: Required (Producer/ProductionTeam role)

```javascript
// Request
{
  name: "Indie Films Team",
  productionHouse: "XYZ Productions",
  description: "Our core production team for indie films"
}

// Response
{
  success: true,
  data: {
    _id: "team_xyz123",
    name: "Indie Films Team",
    productionHouse: "XYZ Productions",
    owner: "user_123",
    members: [
      {
        user: "user_123",      // Auto-added as owner
        role: "Owner",
        addedAt: "2024-01-22T10:00:00Z"
      }
    ]
  }
}
```

**What Happens**:
- ✅ New `ProductionTeam` document created
- ✅ Creator is set as `Owner`
- ✅ Creator is auto-added to `members` array with `Owner` role

---

### 3.2 Owner Invites Team Members

**Endpoint**: `POST /api/v1/teamInvitations`
**Auth**: Required + Must be team owner

```javascript
// Request
{
  teamId: "team_xyz123",
  inviteeEmail: "recruiter@example.com",
  role: "Recruiter",              // or "Viewer"
  projectId: "proj_123"           // Optional: invite to specific project
}

// Response
{
  success: true,
  data: {
    _id: "inv_abc789",
    team: "team_xyz123",
    invitedBy: "user_123",
    invitee: "user_recruiter",
    role: "Recruiter",
    status: "pending",
    token: "a1b2c3d4e5f6...",    // Unique token for accepting
    expiresAt: "2024-01-24T10:00:00Z"  // 48-hour expiration
  }
}
```

**What Happens**:
- ✅ `TeamInvitation` document created with `pending` status
- ✅ 48-hour expiration timer starts
- ✅ Unique token generated for acceptance
- ✅ Notification sent to invitee
- ✅ Invitee receives notification with invitation details

---

### 3.3 Invitee Accepts/Rejects Invitation

#### Option A: Accept Invitation

**Endpoint**: `POST /api/v1/teamInvitations/accept`
**Auth**: Required

```javascript
// Request (either token or invitationId)
{
  invitationId: "inv_abc789",  // or token: "a1b2c3d4e5f6..."
}

// Response
{
  success: true,
  data: {
    teamId: "team_xyz123",
    invitationId: "inv_abc789"
  }
}
```

**What Happens**:
- ✅ Invitation status changed to `accepted`
- ✅ Invitee added to team's `members` array
- ✅ Member gets assigned role (e.g., `Recruiter`)
- ✅ Team owner notified of acceptance
- ✅ Invitee now has access to team resources

#### Option B: Reject Invitation

**Endpoint**: `POST /api/v1/teamInvitations/reject`

```javascript
// Request
{
  invitationId: "inv_abc789"
}

// Response
{
  success: true,
  data: {
    invitationId: "inv_abc789"
  }
}
```

**What Happens**:
- ✅ Invitation status changed to `rejected`
- ✅ Invitee NOT added to team
- ✅ Team owner notified of rejection

---

### 3.4 Team Member Creates Project

**Endpoint**: `POST /api/v1/projects`
**Auth**: Required + Must be team member with `Owner` or `Recruiter` role

```javascript
// Request
{
  teamId: "team_xyz123",
  name: "Monsoon Action Drama",
  genre: "Action Drama",
  language: "English",
  location: "Goa",
  startDate: "2024-06-01",
  endDate: "2024-08-15",
  description: "An action-packed drama set during monsoon season",
  roles: [
    {
      roleName: "Lead Hero",
      roleType: "Lead",
      ageMin: 28,
      ageMax: 38,
      gender: "Male",
      physicalTraits: "Athletic build, tall",
      skillsRequired: ["Acting", "Martial Arts", "Horse Riding"],
      experienceLevel: "Professional",
      roleDescription: "The protagonist of our story",
      numberOfOpenings: 1
    },
    {
      roleName: "Lead Heroine",
      roleType: "Lead",
      ageMin: 25,
      ageMax: 35,
      gender: "Female",
      physicalTraits: "Any",
      skillsRequired: ["Acting"],
      experienceLevel: "Intermediate",
      roleDescription: "Female lead character",
      numberOfOpenings: 1
    }
  ]
}

// Response
{
  success: true,
  data: {
    _id: "proj_monsoon123",
    team: "team_xyz123",
    name: "Monsoon Action Drama",
    genre: "Action Drama",
    language: "English",
    location: "Goa",
    startDate: "2024-06-01T00:00:00Z",
    endDate: "2024-08-15T00:00:00Z",
    description: "An action-packed drama set during monsoon season",
    createdBy: "user_recruiter",
    collaborators: ["user_recruiter"],
    roles: [
      {
        roleName: "Lead Hero",
        roleType: "Lead",
        ageMin: 28,
        ageMax: 38,
        gender: "Male",
        // ... other fields
      },
      {
        roleName: "Lead Heroine",
        roleType: "Lead",
        ageMin: 25,
        ageMax: 35,
        gender: "Female",
        // ... other fields
      }
    ],
    status: "draft",
    createdAt: "2024-01-22T10:00:00Z",
    updatedAt: "2024-01-22T10:00:00Z"
  }
}
```

**What Happens**:
- ✅ New `FilmProject` created with `draft` status
- ✅ Project linked to team via `team` field
- ✅ Creator becomes first collaborator
- ✅ Roles array populated if provided
- ✅ CastingCall documents **auto-generated** in background for each role
- ✅ Team members notified about new project
- ✅ Auto-generated castings inherit project details (location, dates, etc.)

---

### 3.5 Auto-Generated Casting Calls

When a project is created with roles, the system automatically generates `CastingCall` documents:

**Auto-Generation Logic** (in background, non-blocking):

```javascript
// For each role in the project:
{
  project: "proj_monsoon123",
  team: "team_xyz123",
  producer: "user_recruiter",
  
  roleTitle: role.roleName,           // e.g., "Lead Hero"
  description: role.roleDescription,  // e.g., "The protagonist of our story"
  
  ageRange: {
    min: role.ageMin,                 // 28
    max: role.ageMax                  // 38
  },
  
  genderRequirement: role.gender.toLowerCase(),  // "male"
  experienceLevel: role.experienceLevel.toLowerCase(),  // "professional"
  skillsRequired: role.skillsRequired,           // ["Acting", "Martial Arts", "Horse Riding"]
  location: project.location,                    // "Goa"
  numberOfOpenings: role.numberOfOpenings,      // 1
  
  // Dates calculated relative to project dates
  submissionDeadline: "2024-05-26T23:59:59Z",   // 7 days before project start
  auditionDate: "2024-05-30T10:00:00Z",         // ~14 days before project start
  shootStartDate: "2024-06-01T00:00:00Z",       // Project start date
  shootEndDate: "2024-08-15T00:00:00Z",         // Project end date
  
  status: "open",
  createdAt: "2024-01-22T10:00:00Z"
}
```

---

### 3.6 Add Role to Existing Project

**Endpoint**: `POST /api/v1/projects/:projectId/roles`
**Auth**: Required + Must be team member

```javascript
// Request
{
  role: {
    roleName: "Villain",
    roleType: "Supporting",
    ageMin: 35,
    ageMax: 50,
    gender: "Male",
    physicalTraits: "Intense look, commanding presence",
    skillsRequired: ["Acting", "Combat"],
    experienceLevel: "Professional",
    roleDescription: "The antagonist",
    numberOfOpenings: 1
  }
}

// Response
{
  success: true,
  data: {
    // Full updated project with new role added
  }
}
```

**What Happens**:
- ✅ New role added to project's `roles` array
- ✅ CastingCall auto-generated for new role
- ✅ Team members notified
- ✅ Casting immediately becomes searchable

---

### 3.7 Create Casting from Role (Manual)

**Endpoint**: `POST /api/v1/projects/:projectId/roles/:roleId/casting`
**Auth**: Required + Must be team member

```javascript
// Request (if you want custom casting details)
{
  roleId: "role_id",
  castingData: {
    description: "Custom casting description",
    auditionDate: "2024-02-15T10:00:00",
    submissionDeadline: "2024-02-10T18:00:00"
  }
}

// Response
{
  success: true,
  data: {
    _id: "casting_123",
    project: "proj_monsoon123",
    team: "team_xyz123",
    // ... casting call details
  }
}
```

---

## 4. Team Collaboration Features

### 4.1 Team Member Roles & Permissions

| Feature | Owner | Recruiter | Viewer |
|---------|-------|-----------|--------|
| Create Projects | ✅ | ✅ | ❌ |
| Add Roles to Project | ✅ | ✅ | ❌ |
| Create Casting Calls | ✅ | ✅ | ❌ |
| View Projects | ✅ | ✅ | ✅ |
| View Casting Calls | ✅ | ✅ | ✅ |
| Manage Team Members | ✅ | ❌ | ❌ |
| Invite Members | ✅ | ❌ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ |
| Update Team Info | ✅ | ❌ | ❌ |

### 4.2 Team Management APIs

#### Get My Teams

**Endpoint**: `GET /api/v1/teams`
**Auth**: Required

```javascript
// Response
{
  success: true,
  data: [
    {
      _id: "team_xyz123",
      name: "Indie Films Team",
      productionHouse: "XYZ Productions",
      description: "...",
      owner: "user_123",
      members: [...]
    },
    // More teams...
  ]
}
```

**Returns**: All teams where user is owner or member

#### Get Team Details

**Endpoint**: `GET /api/v1/teams/:teamId`
**Auth**: Required + Must be team member

```javascript
// Response includes:
// - Team info (name, description, etc.)
// - Owner details (name, email, profileImage)
// - All member details (with roles)
```

#### Remove Team Member

**Endpoint**: `DELETE /api/v1/teams/:teamId/members/:memberId`
**Auth**: Required + Must be team owner

```javascript
// Only owner can remove members
```

#### Leave Team

**Endpoint**: `POST /api/v1/teams/:teamId/leave`
**Auth**: Required

```javascript
// Any member can leave their team
```

#### Update Team Info

**Endpoint**: `PUT /api/v1/teams/:teamId`
**Auth**: Required + Must be team owner

```javascript
// Request
{
  name: "Updated Team Name",
  productionHouse: "Updated Production House",
  description: "Updated description"
}
```

#### Delete Team

**Endpoint**: `DELETE /api/v1/teams/:teamId`
**Auth**: Required + Must be team owner

```javascript
// Deletes entire team and associated resources
```

---

## 5. Project Management Features

### 5.1 Project Lifecycle

```
┌─────────────────────────────────────────┐
│  PROJECT LIFECYCLE                       │
└─────────────────────────────────────────┘

DRAFT STATE:
• Project created but not yet launched
• Team can add/modify roles
• Casting calls auto-generated but not visible publicly
• Status: "draft"

ACTIVE STATE:
• Project officially launched
• Roles finalized
• Casting calls visible to public
• Actors can apply
• Status: "active"

ARCHIVED STATE:
• Project completed or cancelled
• Casting calls no longer visible
• Applications closed
• Project data retained for records
• Status: "archived"
```

### 5.2 Project APIs

#### Create Project

**Endpoint**: `POST /api/v1/projects`
**Auth**: Required + Must be team member

#### Get My Projects

**Endpoint**: `GET /api/v1/projects`
**Auth**: Required

```javascript
// Returns all projects for teams where user is member
```

#### Get Project Details

**Endpoint**: `GET /api/v1/projects/:projectId`
**Auth**: Optional (public readable)

```javascript
// Response includes:
// - All project details
// - Team info
// - All roles
// - Related casting calls (if public)
```

#### Update Project

**Endpoint**: `PUT /api/v1/projects/:projectId`
**Auth**: Required + Must be team member

```javascript
// Can update: name, genre, language, location, dates, description
```

#### Delete Project

**Endpoint**: `DELETE /api/v1/projects/:projectId`
**Auth**: Required + Must be project creator or team owner

```javascript
// Deletes project and all related casting calls
// Notifies all team members
```

---

## 6. Casting Management Features

### 6.1 Public Casting Discovery

#### Browse All Casting Calls

**Endpoint**: `GET /api/v1/casting`
**Auth**: Optional

```javascript
// Returns all active casting calls for projects with status != 'archived'

// Query Filters Available:
// - experience: 'beginner', 'intermediate', 'professional'
// - gender: 'male', 'female', 'any'
// - location: string search
// - producer: specific producer ID
```

#### Get Team's Casting Calls

**Endpoint**: `GET /api/v1/casting/team/:teamId`
**Auth**: Required + Must be team member

```javascript
// Returns all casting calls for team's projects
// Only team members can access this endpoint
```

#### Get Producer's Casting Calls

**Endpoint**: `GET /api/v1/casting/producer`
**Auth**: Required + Must be producer

```javascript
// Returns all casting calls created by authenticated producer
// Includes both active and expired/closed castings
// Useful for producer dashboard
```

### 6.2 Casting Call Auto-Population

When roles are defined in a project, casting calls are **automatically created** with:

```javascript
// Casting inherits from Role:
- roleTitle → roleTitle
- roleDescription → description
- ageMin/Max → ageRange.min/max
- gender → genderRequirement
- experienceLevel → experienceLevel
- skillsRequired → skillsRequired
- numberOfOpenings → numberOfOpenings
- project.location → location

// Dates calculated intelligently:
- submissionDeadline = NOW + 7 days
- auditionDate = NOW + 14 days
- shootStartDate = project.startDate (or auditionDate if not set)
- shootEndDate = project.endDate (or shootStartDate + 7 days if not set)
```

---

## 7. Notification System

### 7.1 Team-Related Notifications

| Event | Recipients | Message |
|-------|-----------|---------|
| Invitation Sent | Invitee | "You have been invited to join {team.name} as {role}" |
| Invitation Accepted | Inviter | "{user.name} accepted your invite to {team.name}" |
| Invitation Rejected | Inviter | "{user.name} rejected your invite" |
| Member Removed | Removed Member | "You have been removed from {team.name}" |
| Member Left | Team Owner | "{user.name} left {team.name}" |

### 7.2 Project-Related Notifications

| Event | Recipients | Message |
|-------|-----------|---------|
| Project Created | Team Members | "New project: {project.name}" |
| Role Added | Team Members | "New role added to {project.name}" |
| Project Updated | Team Members | "{project.name} was updated" |
| Project Deleted | Team Members | "{project.name} was removed from team" |

---

## 8. Authorization & Security

### 8.1 Authorization Rules

```javascript
// Team Operations
✅ Team Owner:    All operations
✅ Team Member:   View team, Create projects, Manage castings
❌ Non-member:    No access

// Project Operations
✅ Team Owner:    All operations
✅ Team Member:   Create, view, delete
❌ Non-member:    View only (if project.status != 'archived')

// Casting Operations
✅ Public:        View all public castings
✅ Team Owner:    Create, manage castings for team's projects
✅ Team Member:   Create, manage castings for team's projects
✅ Actors:        Apply to castings
```

### 8.2 Token-Based Invitation System

```javascript
// Invitation Flow:
1. Owner creates invitation → generates unique token
2. Token sent via email/notification
3. Invitee clicks link with token
4. Invitee authenticates
5. Frontend includes token in accept request
6. Backend verifies token + user + expiration
7. If valid: add member to team
```

---

## 9. Data Relationships Diagram

```
User/ProductionHouse
    │
    ├─── Creates ──→ ProductionTeam
    │               │
    │               ├─── Contains ──→ Members (User[])
    │               │
    │               └─── Has ──→ FilmProject[]
    │                            │
    │                            ├─── Created By ──→ User
    │                            │
    │                            ├─── Collaborators ──→ User[]
    │                            │
    │                            └─── Contains ──→ Roles[]
    │                                            │
    │                                            └─── Generates ──→ CastingCall
    │
    ├─── Receives ──→ TeamInvitation
    │               │
    │               └─── For Team ──→ ProductionTeam
    │
    └─── Creates ──→ CastingCall
                    │
                    └─── For Project ──→ FilmProject
```

---

## 10. Example Workflows

### Workflow 1: Producer Creates Project with Team

```
1. Producer signs up (role: Producer or ProductionTeam)
2. Producer creates team:
   POST /teams {name, productionHouse, description}
3. Producer invited recruiter:
   POST /teamInvitations {teamId, inviteeEmail, role: "Recruiter"}
4. Recruiter accepts invitation:
   POST /teamInvitations/accept {invitationId}
5. Recruiter creates project:
   POST /projects {teamId, name, genre, roles: [...]}
6. System auto-generates casting calls for each role
7. Actors browse castings:
   GET /casting
8. Actors apply to castings
9. Team reviews applications in dashboard
10. Team selects/rejects candidates
```

### Workflow 2: Multiple Recruiters Collaborating

```
1. Team Owner invites Recruiter A:
   POST /teamInvitations {teamId, inviteeEmail: "recruiter-a@..."}
2. Team Owner invites Recruiter B:
   POST /teamInvitations {teamId, inviteeEmail: "recruiter-b@..."}
3. Both recruiters accept invitations
4. Both can now:
   - View team and projects
   - Create projects
   - Add roles
   - Create/manage casting calls
5. Both receive notifications of each other's actions
6. Team is fully collaborative
```

### Workflow 3: Viewer-Only Access

```
1. Team Owner invites colleague as "Viewer":
   POST /teamInvitations {teamId, inviteeEmail, role: "Viewer"}
2. Colleague accepts invitation
3. Colleague can:
   - ✅ View all team projects
   - ✅ View all team casting calls
   - ✅ View applications/submissions
4. Colleague CANNOT:
   - ❌ Create projects
   - ❌ Add roles
   - ❌ Create casting calls
   - ❌ Manage team members
```

---

## 11. Key Features Summary

### Team Collaboration
- ✅ Unlimited team creation
- ✅ Multiple role types (Owner, Recruiter, Viewer)
- ✅ Email-based invitations
- ✅ 48-hour invitation expiration
- ✅ Real-time notifications
- ✅ Member management (add, remove, leave)

### Project Management
- ✅ Draft/Active/Archived status
- ✅ Role definitions with detailed requirements
- ✅ Multi-collaborator projects
- ✅ Project versioning (updatable)
- ✅ Automatic casting call generation

### Casting Management
- ✅ Auto-populated casting details from roles
- ✅ Public casting discovery
- ✅ Advanced filtering (experience, gender, location)
- ✅ Team-scoped casting views
- ✅ Producer dashboard

### Notifications
- ✅ Invitation notifications
- ✅ Project activity notifications
- ✅ Team member notifications
- ✅ Real-time updates

---

## 12. Module Dependency Graph

```
Models:
├── User
│   └── references: ProductionTeam, FilmProject, CastingCall
├── ProductionHouse
│   └── references: ProductionTeam, FilmProject
├── ProductionTeam
│   ├── references: User, FilmProject, TeamInvitation
│   └── embedded: Member (user[], role[])
├── FilmProject
│   ├── references: ProductionTeam, User, CastingCall
│   └── embedded: Role, Collaborator[]
├── TeamInvitation
│   └── references: ProductionTeam, User, FilmProject
└── CastingCall
    └── references: FilmProject, ProductionTeam, User

Controllers:
├── auth.js (User registration, login, role management)
├── teams.js (Team CRUD, member management)
├── projects.js (Project CRUD, role management)
├── teamInvitations.js (Invitation flow)
├── casting.js (Casting discovery, filtering)
└── notifications.js (Notification delivery)

Middleware:
├── auth.js (Authentication, authorization, role checking)
└── upload.js (File handling for videos)
```

---

## 13. API Quick Reference

### Teams
```
POST   /api/v1/teams                    Create team
GET    /api/v1/teams                    List my teams
GET    /api/v1/teams/:id                Get team details
PUT    /api/v1/teams/:id                Update team
DELETE /api/v1/teams/:id                Delete team
DELETE /api/v1/teams/:id/members/:mid   Remove member
POST   /api/v1/teams/:id/leave          Leave team
```

### Team Invitations
```
POST   /api/v1/teamInvitations          Send invitation
POST   /api/v1/teamInvitations/accept   Accept invitation
POST   /api/v1/teamInvitations/reject   Reject invitation
GET    /api/v1/teamInvitations/my       Get my invitations
```

### Projects
```
POST   /api/v1/projects                 Create project
GET    /api/v1/projects                 List my projects
GET    /api/v1/projects/:id             Get project details
PUT    /api/v1/projects/:id             Update project
DELETE /api/v1/projects/:id             Delete project
POST   /api/v1/projects/:id/roles       Add role to project
POST   /api/v1/projects/:id/roles/:rid/casting  Create casting from role
```

### Casting
```
GET    /api/v1/casting                  Get all castings
GET    /api/v1/casting/team/:teamId     Get team castings
GET    /api/v1/casting/producer         Get my castings
```

---

## Summary

Actory's project creation and team collaboration system is built on:

1. **Flexible Team Structure**: Teams with multiple role types for different permission levels
2. **Streamlined Invitations**: Email-based with automatic notifications
3. **Intelligent Project Management**: Status tracking with automatic casting generation
4. **Collaborative Workflows**: Multiple team members can work on same projects
5. **Smart Casting Management**: Auto-populated from role definitions
6. **Real-time Notifications**: Keep all team members informed
7. **Granular Permissions**: Owner, Recruiter, and Viewer roles with specific capabilities

This architecture enables production houses to efficiently manage teams, create projects, define casting requirements, and collaborate seamlessly with their team members.
