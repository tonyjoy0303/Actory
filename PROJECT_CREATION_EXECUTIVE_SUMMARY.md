# Project Creation & Team Collaboration - Executive Summary

## Quick Overview

Actory enables production houses to efficiently manage **teams**, create **film projects**, define **roles**, and automatically generate **casting calls** with team collaboration features.

---

## Key Concepts at a Glance

### 1. **ProductionTeam** (Team Container)
- Created by producers/production houses
- Contains multiple members with different roles
- Members can be: **Owner**, **Recruiter**, or **Viewer**
- Serves as a container for all projects and castings

### 2. **FilmProject** (Project Definition)
- Created by team members within a team
- Contains detailed project information
- Includes **Roles** array (job definitions)
- Status: Draft → Active → Archived
- Auto-generates casting calls from roles

### 3. **Roles** (Job Positions)
- Defined within projects
- Specify: name, type, age range, gender, skills, experience
- Each role can have multiple openings
- **Automatically creates a CastingCall**

### 4. **CastingCall** (Job Posting)
- Auto-generated from roles
- Visible to public (if project is active)
- Actors can apply to castings
- Contains all role requirements + dates

### 5. **TeamInvitation** (Membership Flow)
- Owner invites users to join team
- Token-based, 48-hour expiration
- Invitee can accept or reject
- Upon acceptance, user becomes team member with specified role

---

## The Complete Flow (6 Steps)

```
1. PRODUCER CREATES TEAM
   POST /api/v1/teams
   → ProductionTeam document created
   → Creator becomes Team Owner
   
2. OWNER INVITES RECRUITERS
   POST /api/v1/teamInvitations
   → Invitation sent with unique token
   → Email notification to invitee
   
3. RECRUITER ACCEPTS INVITE
   POST /api/v1/teamInvitations/accept
   → Recruiter added to team
   → Gets "Recruiter" role
   
4. RECRUITER CREATES PROJECT
   POST /api/v1/projects
   → FilmProject created
   → Roles array populated
   
5. SYSTEM AUTO-GENERATES CASTINGS
   (Background process - non-blocking)
   → For each role, CastingCall created
   → Castings inherit role details
   → Dates calculated from project dates
   
6. ACTORS DISCOVER & APPLY
   GET /api/v1/casting?filters
   → Actors browse active castings
   → Apply with video + cover letter
   → Applications appear in team dashboard
```

---

## Role-Based Permissions

| Capability | Owner | Recruiter | Viewer |
|-----------|-------|-----------|--------|
| Create Team | ✅ | - | - |
| Invite Members | ✅ | - | - |
| Create Projects | ✅ | ✅ | - |
| Add Roles | ✅ | ✅ | - |
| Create Castings | ✅ | ✅ | - |
| View Team Resources | ✅ | ✅ | ✅ |
| Manage Applications | ✅ | ✅ | - |
| Delete Project | ✅ | ✅ | - |

---

## Core Data Models

### ProductionTeam
```javascript
{
  _id: ObjectId,
  name: String,
  productionHouse: String,
  owner: Reference(User),
  members: [
    { user: Reference(User), role: String }
  ]
}
```

### FilmProject
```javascript
{
  _id: ObjectId,
  team: Reference(ProductionTeam),
  name: String,
  createdBy: Reference(User),
  roles: [RoleSchema],
  status: 'draft' | 'active' | 'archived'
}
```

### TeamInvitation
```javascript
{
  _id: ObjectId,
  team: Reference(ProductionTeam),
  invitee: Reference(User),
  role: 'Recruiter' | 'Viewer',
  status: 'pending' | 'accepted' | 'rejected',
  token: String,
  expiresAt: Date
}
```

### CastingCall
```javascript
{
  _id: ObjectId,
  project: Reference(FilmProject),
  team: Reference(ProductionTeam),
  roleTitle: String,
  ageRange: { min, max },
  genderRequirement: String,
  experienceLevel: String,
  status: 'open' | 'closed' | 'filled'
}
```

---

## Key Features

### 1. Team Management
- ✅ Create unlimited teams
- ✅ Invite members (by email or user ID)
- ✅ Email-based invitations with token
- ✅ 48-hour invitation expiration
- ✅ Role-based access control (Owner, Recruiter, Viewer)
- ✅ Member management (add, remove, leave)

### 2. Project Management
- ✅ Create projects within teams
- ✅ Define multiple roles per project
- ✅ Set project dates, location, description
- ✅ Multi-member collaboration
- ✅ Status tracking (Draft → Active → Archived)
- ✅ Edit projects anytime before publication

### 3. Auto-Casting Generation
- ✅ Casting calls auto-created from roles
- ✅ Inherits role specifications
- ✅ Intelligent date calculation
- ✅ Non-blocking background process
- ✅ Immediate visibility after creation

### 4. Public Casting Discovery
- ✅ Public casting search API
- ✅ Filter by experience, gender, location
- ✅ Full role details visible
- ✅ Team-scoped castings (private)
- ✅ Producer dashboard for management

### 5. Notifications
- ✅ Team invitation notifications
- ✅ Project creation alerts
- ✅ New role notifications
- ✅ Application received alerts
- ✅ Real-time updates for team members

---

## Important Technical Details

### Invitation System
```
1. Owner creates invitation
   ├─ Generates unique token
   ├─ Sets 48-hour expiration
   └─ Sends email notification
   
2. Invitee clicks email link
   ├─ Frontend extracts token
   └─ Sends to /accept endpoint
   
3. Backend verifies
   ├─ Checks token validity
   ├─ Checks expiration
   ├─ Verifies invitee identity
   └─ If valid: adds to team members
```

### Auto-Casting Generation
```
Project Creation Flow:
1. User sends POST /projects with roles array
2. Project created immediately (status: draft)
3. Response sent to user
4. Background process starts (non-blocking):
   ├─ For each role:
   │  ├─ Parse/validate role data
   │  ├─ Calculate dates intelligently
   │  ├─ Create CastingCall document
   │  └─ Insert to database
   │
   └─ Notify all team members
   
Note: User gets response before castings complete
```

### Authorization Checks
```
For Project Creation:
1. Check authentication (JWT valid)
2. Check user role (Producer or ProductionTeam)
3. Fetch team from database
4. Verify user is team owner OR team member
5. If all pass: create project
6. If any fail: return appropriate error code
```

---

## API Quick Reference

### Teams
```
POST   /api/v1/teams                Create team
GET    /api/v1/teams                Get my teams
GET    /api/v1/teams/:id            Get team details
PUT    /api/v1/teams/:id            Update team
DELETE /api/v1/teams/:id            Delete team
DELETE /api/v1/teams/:id/members/:mid Remove member
POST   /api/v1/teams/:id/leave      Leave team
```

### Projects
```
POST   /api/v1/projects             Create project
GET    /api/v1/projects             Get my projects
GET    /api/v1/projects/:id         Get project details
PUT    /api/v1/projects/:id         Update project
DELETE /api/v1/projects/:id         Delete project
POST   /api/v1/projects/:id/roles   Add role
```

### Invitations
```
POST   /api/v1/teamInvitations      Send invitation
POST   /api/v1/teamInvitations/accept  Accept
POST   /api/v1/teamInvitations/reject  Reject
GET    /api/v1/teamInvitations/my   Get my invitations
```

### Casting
```
GET    /api/v1/casting              Get all castings (public)
GET    /api/v1/casting/team/:id     Get team castings
GET    /api/v1/casting/producer     Get producer's castings
```

---

## Common Workflows

### Workflow A: Team Owner Sets Up Team
```
1. Sign up → Get role "Producer"
2. POST /teams → Create team
3. POST /teamInvitations → Invite recruiter
4. [Recruiter accepts invitation]
5. Team is ready for projects
```

### Workflow B: Recruiter Creates Project
```
1. Accept team invitation
2. POST /projects with roles
3. System auto-generates castings
4. Castings visible to public
5. Actors can discover and apply
```

### Workflow C: View-Only Colleague
```
1. Invited to team as "Viewer"
2. Can view all projects
3. Can view all castings
4. Can view applications
5. Cannot create/edit anything
```

---

## Error Handling

### Common Status Codes
- **201**: Resource created successfully
- **200**: Success
- **400**: Bad request (validation error)
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (not authorized for this action)
- **404**: Resource not found
- **500**: Server error

### Error Response Format
```javascript
{
  success: false,
  message: "Human-readable error message"
}
```

---

## Performance Considerations

### Non-Blocking Operations
- Casting call auto-generation happens in background
- Notifications sent asynchronously
- User gets immediate response
- Process continues after response sent

### Indexing
- TeamId indexed for fast project queries
- UserId indexed for team membership
- Status indexed for filtering
- Expiration dates indexed for cleanup

### Scalability
- No N+1 query problems
- Proper use of population/references
- Notification system uses best-effort delivery
- Projects don't block on casting generation

---

## Security

### Authentication
- JWT-based authentication required for most endpoints
- Token verified in middleware
- User extracted from token

### Authorization
- Role-based access control
- Owner checks for team operations
- Member checks for project operations
- Team scope validation

### Data Validation
- All inputs validated before database operations
- Email format validation
- URL validation for videos
- Date range validation

---

## Getting Started Checklist

To use project creation and team collaboration:

- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] Email service configured (for invitations)
- [ ] Authentication middleware working
- [ ] JWT tokens generated on login
- [ ] User has Producer role
- [ ] CORS configured for frontend

Then:
1. Create a team
2. Invite team members
3. Create a project with roles
4. View auto-generated castings
5. Share public casting link with actors

---

## Documents in This Collection

1. **PROJECT_CREATION_AND_TEAM_COLLABORATION_GUIDE.md** (Main Guide)
   - Detailed explanation of all models
   - Complete flow documentation
   - Permissions matrix
   - Notification system details

2. **PROJECT_CREATION_VISUAL_FLOWS.md** (Visual Diagrams)
   - Complete user journeys
   - Data flow diagrams
   - State machines
   - Entity relationships

3. **PROJECT_CREATION_CODE_REFERENCE.md** (API & Code)
   - All API endpoints with examples
   - Request/response formats
   - Frontend React examples
   - Backend controller examples
   - Database query examples

4. **PROJECT_CREATION_EXECUTIVE_SUMMARY.md** (This Document)
   - Quick overview
   - Key concepts
   - Essential information
   - Quick reference

---

## Quick Links to Main Guide Sections

[See PROJECT_CREATION_AND_TEAM_COLLABORATION_GUIDE.md for:]

- Section 1: User Roles & Permissions
- Section 2: Core Data Models
- Section 3: Complete Project Creation Flow
- Section 4: Team Collaboration Features
- Section 5: Project Management Features
- Section 6: Casting Management Features
- Section 7: Notification System
- Section 8: Authorization & Security
- Section 9: Data Relationships
- Section 10: Example Workflows
- Section 11: Key Features Summary
- Section 12: Module Dependency Graph
- Section 13: API Quick Reference

---

## Key Takeaways

1. **Teams are containers** for collaboration
2. **Roles auto-generate castings** (no manual work needed)
3. **Invitations are token-based** with 48-hour expiration
4. **Authorization is granular** (Owner/Recruiter/Viewer)
5. **All major operations notify team members**
6. **API is RESTful** with consistent response formats
7. **Background processes are non-blocking**
8. **Public castings are searchable** by actors

---

This system provides a complete end-to-end solution for production houses to manage projects and collaborate with teams for efficient casting.
