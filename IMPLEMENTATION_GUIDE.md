# Implementation Guide: Project Roles, Castings & Team Notifications

## Overview
This implementation adds the following features:
1. **Project Roles** - Define multiple roles within a film project
2. **Role-Based Castings** - Create casting calls automatically from project roles
3. **Team Notifications** - All team members notified when projects, roles, and castings are created
4. **Team Member Visibility** - All team members can see projects, roles, and castings
5. **Application Tracking** - View all applications submitted for role-specific castings

---

## Backend Changes

### 1. **Models Updated**

#### FilmProject.js
```javascript
// NEW: RoleSchema added to project
const RoleSchema = new mongoose.Schema({
  roleName: String,          // e.g., "Lead Actor", "Villain"
  roleType: String,          // Lead, Supporting, Guest, Extra
  ageMin/ageMax: Number,     // Age range
  gender: String,            // Male, Female, Any
  physicalTraits: String,    // Optional physical requirements
  skillsRequired: [String],  // Array of required skills
  experienceLevel: String,   // Beginner, Intermediate, Professional
  roleDescription: String,   // Description of the role
  numberOfOpenings: Number,  // How many actors needed
  castingCallId: ObjectId,   // Reference to created CastingCall
  createdAt: Date
});

// Added to FilmProject:
roles: [RoleSchema]          // Array of roles in project
```

#### CastingCall.js
```javascript
// NEW FIELDS ADDED:
project: ObjectId,           // Reference to FilmProject
projectRole: ObjectId,       // Reference to the specific role within project
team: ObjectId,              // Reference to ProductionTeam (for filtering)
```

### 2. **Controllers Updated**

#### projects.js
**New Methods**:
- `updateProject(req, res)` - Update project with new status/roles
  - Notifies team members of updates
  - Returns updated project

- `addRole(req, res)` - Add a role to an existing project
  - POST `/projects/:id/roles`
  - Validates role name requirement
  - Notifies all team members
  - Returns updated project

- `createCastingFromRole(req, res)` - Create casting call from project role
  - POST `/projects/:id/roles/:roleId/casting`
  - Maps role requirements to casting fields
  - Auto-fills age, gender, skills from role
  - Creates notification for team members
  - Updates role with castingCallId reference
  - Returns created CastingCall

**Updated Methods**:
- `createProject()` - Now accepts roles array in request body
- `getProjects()` - Populates team info

### 3. **Controllers Updated**

#### casting.js
**New Method**:
- `getTeamCastingCalls(req, res)` - Get all castings for a team's projects
  - GET `/casting/team/:teamId`
  - Requires team membership verification
  - Returns all castings where team field matches
  - Populates producer and project data

**Updated Methods**:
- `getCastingCalls()` - Now populates project info
- `getProducerCastingCalls()` - Now populates project info

### 4. **Routes Updated**

#### routes/projects.js
```javascript
POST   /projects/:id           - Update project
POST   /projects/:id/roles     - Add new role
POST   /projects/:id/roles/:roleId/casting - Create casting from role
```

#### routes/casting.js
```javascript
GET    /casting/team/:teamId   - Get team's castings
```

---

## Frontend Changes

### 1. **New Component: ProjectDetails.jsx**
**Path**: `src/pages/ProjectDetails.jsx`

**Purpose**: Manage project details, add roles, and create castings

**Features**:
- View project information (name, genre, language, dates)
- List all roles in the project
- Add new roles via dialog
  - Role name (required)
  - Type (Lead, Supporting, Guest, Extra)
  - Experience level
  - Age range
  - Gender requirement
  - Skills
  - Number of openings
  - Role description

- Create casting from role via dialog
  - Auto-fills from role data
  - Sets audition date and submission deadline
  - Creates casting and updates role.castingCallId

**State Management**:
- `showAddRole` - Dialog visibility for adding roles
- `showCreateCasting` - Dialog visibility for creating casting
- `selectedRole` - Currently selected role for casting creation

**Mutations**:
- `addRoleMutation` - POST `/projects/:id/roles`
- `createCastingMutation` - POST `/projects/:id/roles/:roleId/casting`

### 2. **Updated Component: CastingList.jsx**

**Changes**:
- Displays project name in casting cards
- Shows "My Team Castings" button for producers/team members
- Fetches user's teams on load
- Can toggle between public and team-specific castings
- Added project reference in each casting card display

**New State**:
- `showTeamCastings` - Toggle between public and team castings
- `userTeams` - List of teams user belongs to

---

## Data Flow Examples

### Workflow 1: Create Project with Roles
```
1. Producer creates project at /projects
   - Fill: name, genre, language, location, description
   
2. POST /projects with body:
   {
     teamId: "xxx",
     name: "Summer Dreams Feature",
     genre: "Drama",
     language: "English",
     roles: []  // Initial empty or with roles
   }

3. Backend:
   - Creates FilmProject with team reference
   - Saves roles array
   - Notifies all team members: "New project created"
   
4. Frontend: Redirect to /projects/:id (ProjectDetails)
```

### Workflow 2: Add Role to Project
```
1. Producer at ProjectDetails clicks "Add Role"
2. Fill role form:
   - roleName: "Lead Actor"
   - roleType: "Lead"
   - ageMin: 25, ageMax: 35
   - gender: "Male"
   - skillsRequired: "Acting, Martial Arts"
   - experienceLevel: "Professional"
   - numberOfOpenings: 2

3. POST /projects/:id/roles with role object

4. Backend:
   - Validates role.roleName required
   - Pushes role to project.roles array
   - Saves project
   - Notifies all team members: "New role added to project"
   
5. Frontend: 
   - Closes dialog
   - Refreshes project query
   - Shows role in list
```

### Workflow 3: Create Casting from Role
```
1. Producer at ProjectDetails clicks "Create Casting" for a role
2. Fill casting details:
   - description: "Looking for experienced male actor..."
   - location: Auto-filled from project
   - submissionDeadline: Date picker
   - auditionDate: Date picker
   - skills: Auto-filled from role.skillsRequired

3. POST /projects/:id/roles/:roleId/casting with:
   {
     roleId: "role_xyz",
     castingData: { description, auditionDate, submissionDeadline, ... }
   }

4. Backend:
   - Finds project and role
   - Creates CastingCall with:
     * roleTitle: from role.roleName
     * ageRange: from role.ageMin/ageMax
     * genderRequirement: from role.gender
     * experienceLevel: from role.experienceLevel
     * skills: from role.skillsRequired
     * producer: req.user._id
     * project: project._id
     * projectRole: role._id
     * team: project.team._id
   
   - Updates role.castingCallId = castingCall._id
   - Notifies team: "New casting call posted: Lead Actor in Summer Dreams"
   
5. Frontend:
   - Closes dialog
   - Shows "Casting Created" badge on role
   - Casting now visible on /casting page
```

### Workflow 4: Team Members View Team Castings
```
1. Producer/team member goes to /casting
2. Clicks "My Team Castings" button
3. Fetches GET /casting/team/:teamId
4. Returns castings where team field matches
5. Shows castings with:
   - Role title
   - Project name
   - Producer name
   - Submission deadline
   - Experience level
   - Gender requirement
   - Apply button
```

### Workflow 5: View Casting Applications
```
1. Producer at /dashboard/producer views their castings
2. "View Submissions" opens dialog
3. Fetches GET /casting/:castingCallId/videos
4. Shows all applications with:
   - Actor name and profile
   - Audition video
   - Quality assessment score
   - Submission date
   - Status (Pending, Accepted, Rejected)
5. Can sort by: date, name, quality, status, age, height
```

---

## Notification System

### When Notifications Are Sent

1. **Project Created** → All team members notified
   ```
   Title: "New project created"
   Message: "Summer Dreams was created in team My Production House"
   Type: "project"
   RelatedId: project._id
   ```

2. **Project Updated** → All team members notified
   ```
   Title: "Project updated"
   Message: "Summer Dreams was updated with new roles and details"
   Type: "project"
   RelatedId: project._id
   ```

3. **Role Added** → All team members notified
   ```
   Title: "New role added to project"
   Message: "New role \"Lead Actor\" added to Summer Dreams"
   Type: "role"
   RelatedId: project._id
   ```

4. **Casting Created from Role** → All team members notified
   ```
   Title: "New casting call posted"
   Message: "Casting for \"Lead Actor\" in Summer Dreams is now open"
   Type: "casting"
   RelatedId: castingCall._id
   ```

### Notification Service Usage
```javascript
await createNotification({
  user: userId,
  title: 'Notification title',
  message: 'Notification message',
  type: 'project|role|casting',
  relatedId: objectId,
  relatedType: 'film-project|casting-call'
});
```

---

## API Summary

### Projects Endpoints
```
POST   /api/v1/projects                    - Create project
GET    /api/v1/projects                    - Get user's projects
GET    /api/v1/projects/:id                - Get project details
PUT    /api/v1/projects/:id                - Update project
POST   /api/v1/projects/:id/roles          - Add role
POST   /api/v1/projects/:id/roles/:roleId/casting - Create casting
```

### Casting Endpoints
```
GET    /api/v1/casting                     - Get all active castings (public)
GET    /api/v1/casting/producer            - Get producer's castings
GET    /api/v1/casting/team/:teamId        - Get team's castings
GET    /api/v1/casting/:id                 - Get casting details
POST   /api/v1/casting                     - Create casting (manual)
PUT    /api/v1/casting/:id                 - Update casting
DELETE /api/v1/casting/:id                 - Delete casting
```

---

## Frontend Routes

### New/Updated Routes
```
/projects                   - List all user's projects
/projects/:id               - Project details (ProjectDetails.jsx) NEW
/casting                    - Browse all castings (updated)
/casting/new                - Create manual casting
/dashboard/producer         - Producer dashboard (unchanged)
```

---

## Security & Authorization

### Role-Based Access
- **Only team members** can:
  - View project details
  - Add roles to project
  - Create castings from roles
  - View team's castings

- **Only producers** can:
  - Create projects
  - Create castings

- **Anyone (public)** can:
  - View active castings
  - View casting details
  - Apply for casting

### Verification Checks
```javascript
// Check if user is team member
const isTeamMember = String(team.owner) === String(userId) || 
  team.members.some(m => String(m.user) === String(userId));

// Used before:
- Creating project
- Adding role
- Creating casting from role
- Viewing team castings
```

---

## Database Indexes

### Added/Updated Indexes
```javascript
CastingCall:
- project: For finding castings by project
- team: For finding castings by team
- projectRole: For finding castings by role

FilmProject:
- (existing) team: For finding projects by team
```

---

## Testing Checklist

### Backend Tests
- [ ] Create project with roles
- [ ] Add role to existing project
- [ ] Create casting from role
- [ ] Verify notifications sent to all team members
- [ ] Verify team members can view team castings
- [ ] Verify only team members can create castings
- [ ] Verify casting inherits role requirements

### Frontend Tests
- [ ] Navigate to project details
- [ ] Add new role via dialog
- [ ] Create casting from role
- [ ] See "Casting Created" badge on role
- [ ] View casting on /casting page with project name
- [ ] Click "My Team Castings" to filter
- [ ] Apply for casting as actor
- [ ] View applications in producer dashboard

---

## Next Steps

1. **Add Role Editing** - Allow editing/deleting roles
2. **Bulk Role Creation** - Import roles from template
3. **Role Templates** - Save role patterns for reuse
4. **Analytics** - Track applications per role
5. **Role Assignments** - Assign roles to team members
6. **Callback Scheduling** - Schedule callbacks for shortlisted actors

