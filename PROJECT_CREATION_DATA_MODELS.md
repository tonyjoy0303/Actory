# Project & Team Collaboration - Data Model Reference

## Complete Data Model Specification

---

## 1. ProductionTeam Schema

### Database Structure
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  name: {
    type: String,
    required: true,
    maxlength: 120
  },
  productionHouse: {
    type: String,
    maxlength: 120
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Ownership
  owner: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  // Members Array
  members: [
    {
      user: ObjectId (ref: 'User'),
      role: 'Owner' | 'Recruiter' | 'Viewer',
      addedAt: Date
    }
  ],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `owner` (for quick owner lookup)
- `members.user` (for member queries)

### Relationships
- **owner** → User (who created the team)
- **members.user** → User[] (team collaborators)
- **Projects** ← FilmProject[] (projects in this team)

### Business Rules
- Team must have at least one owner
- Owner cannot be removed from team
- Members can only be added via invitations
- Team can be deleted only by owner

---

## 2. FilmProject Schema

### Database Structure
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  name: {
    type: String,
    required: true,
    maxlength: 150
  },
  genre: {
    type: String,
    maxlength: 60
  },
  language: {
    type: String,
    maxlength: 60
  },
  location: {
    type: String,
    maxlength: 120
  },
  
  // Dates
  startDate: Date,
  endDate: Date,
  
  // Description
  description: {
    type: String,
    maxlength: 800
  },
  
  // Team Association
  team: {
    type: ObjectId,
    ref: 'ProductionTeam',
    required: true
  },
  
  // Creator & Collaborators
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [
    {
      type: ObjectId,
      ref: 'User'
    }
  ],
  
  // Roles (Embedded)
  roles: [
    {
      _id: ObjectId,
      roleName: String,
      roleType: 'Lead' | 'Supporting' | 'Guest' | 'Extra',
      ageMin: Number,
      ageMax: Number,
      gender: 'Male' | 'Female' | 'Any',
      physicalTraits: String,
      skillsRequired: [String],
      experienceLevel: 'Beginner' | 'Intermediate' | 'Professional',
      roleDescription: String,
      numberOfOpenings: Number,
      castingCallId: ObjectId (ref: 'CastingCall'),
      createdAt: Date
    }
  ],
  
  // Status
  status: {
    type: 'draft' | 'active' | 'archived',
    default: 'draft'
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `team` (find all projects in team)
- `collaborators` (find user's projects)

### Relationships
- **team** → ProductionTeam (parent container)
- **createdBy** → User (project creator)
- **collaborators** → User[] (team members working on project)
- **roles[].castingCallId** → CastingCall (auto-generated castings)

### Business Rules
- Must belong to a team
- Creator is auto-added as first collaborator
- Roles are embedded (not separate documents)
- Status change from draft to active makes castings public
- Only creator or team owner can delete

---

## 3. TeamInvitation Schema

### Database Structure
```javascript
{
  _id: ObjectId,
  
  // Team & User References
  team: {
    type: ObjectId,
    ref: 'ProductionTeam',
    required: true
  },
  invitedBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  invitee: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  // Optional Project Reference
  project: {
    type: ObjectId,
    ref: 'FilmProject'
  },
  
  // Role Being Offered
  role: {
    type: 'Recruiter' | 'Viewer',
    default: 'Recruiter'
  },
  
  // Invitation Status
  status: {
    type: 'pending' | 'accepted' | 'rejected' | 'expired',
    default: 'pending'
  },
  
  // Token-Based Verification
  token: {
    type: String,
    unique: true,
    index: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    required: true
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `token` (for acceptance via link)
- `invitee` + `status` (user's pending invitations)
- `team` + `status` (team's pending invitations)

### Relationships
- **team** → ProductionTeam (team being invited to)
- **invitedBy** → User (who sent invitation)
- **invitee** → User (who received invitation)
- **project** → FilmProject (optional: specific project invite)

### Business Rules
- Token generated on creation, unique
- Expires 48 hours after creation
- Cannot be accepted by non-invitee
- Cannot be accepted after expiration
- Once accepted, user added to team.members
- Invitee cannot already be team member

---

## 4. CastingCall Schema

### Database Structure
```javascript
{
  _id: ObjectId,
  
  // Project & Team References
  project: {
    type: ObjectId,
    ref: 'FilmProject',
    required: true
  },
  team: {
    type: ObjectId,
    ref: 'ProductionTeam',
    required: true
  },
  
  // Producer
  producer: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  // Role Details (from Role definition)
  roleTitle: String,
  description: String,
  
  // Requirements
  ageRange: {
    min: Number,
    max: Number
  },
  genderRequirement: 'male' | 'female' | 'any',
  experienceLevel: 'beginner' | 'intermediate' | 'professional',
  skillsRequired: [String],
  
  // Logistics
  location: String,
  numberOfOpenings: Number,
  
  // Important Dates
  submissionDeadline: Date,
  auditionDate: Date,
  shootStartDate: Date,
  shootEndDate: Date,
  
  // Status
  status: {
    type: 'open' | 'closed' | 'filled',
    default: 'open'
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `project` (find castings for project)
- `team` (find castings for team)
- `producer` (find producer's castings)
- `submissionDeadline` (sorting by deadline)
- `auditionDate` (sorting by audition date)

### Relationships
- **project** → FilmProject (parent project)
- **team** → ProductionTeam (team managing casting)
- **producer** → User (who created casting)

### Business Rules
- Auto-created from role definitions
- Cannot be created manually if role exists
- Inherits specifications from role
- Dates calculated relative to project dates
- Visible publicly when project is active

---

## 5. Role Schema (Embedded in FilmProject)

### Structure
```javascript
{
  _id: ObjectId,                           // Generated on creation
  roleName: String,                        // e.g., "Lead Hero"
  roleType: 'Lead' | 'Supporting' | 'Guest' | 'Extra',
  ageMin: Number,                          // Must be 1-120
  ageMax: Number,                          // Must be >= ageMin, 1-120
  gender: 'Male' | 'Female' | 'Any',
  physicalTraits: String,                  // max 300 chars
  skillsRequired: [String],                // Array of skill names
  experienceLevel: 'Beginner' | 'Intermediate' | 'Professional',
  roleDescription: String,                 // max 500 chars
  numberOfOpenings: Number,                // Default 1, min 1
  castingCallId: ObjectId,                 // Link to CastingCall
  createdAt: Date
}
```

### Business Rules
- Cannot be created without parent project
- numberOfOpenings must be at least 1
- Age range must be valid (min <= max)
- Skills are required for casting matching

---

## 6. Data Flow: Role to Casting

```
INPUT: Role Definition
┌─────────────────────────────────────────────┐
│ name:          "Lead Hero"                  │
│ ageMin:        28                           │
│ ageMax:        38                           │
│ gender:        "Male"                       │
│ skills:        ["Acting", "Martial Arts"]   │
│ experience:    "Professional"               │
│ description:   "The protagonist"            │
│ numberOfOpenings: 1                         │
└─────────────────────────────────────────────┘
                     ↓
        (Background Auto-Generation)
                     ↓
OUTPUT: CastingCall Document
┌─────────────────────────────────────────────┐
│ roleTitle:      "Lead Hero"                 │
│ description:    "The protagonist"           │
│ ageRange: {                                 │
│   min: 28,                                  │
│   max: 38                                   │
│ }                                           │
│ genderRequirement: "male"                   │
│ experienceLevel: "professional"             │
│ skillsRequired: ["Acting", "Martial Arts"]  │
│ numberOfOpenings: 1                         │
│ location: [from project.location]           │
│ submissionDeadline: [NOW + 7 days]          │
│ auditionDate: [NOW + 14 days]               │
│ shootStartDate: [from project.startDate]    │
│ shootEndDate: [from project.endDate]        │
│ status: "open"                              │
│ project: [link]                             │
│ team: [link]                                │
│ producer: [link]                            │
└─────────────────────────────────────────────┘
```

---

## 7. Complete Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                           │
└──────────────────────────────────────────────────────────────────┘

                          User
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │                 │                 │
         ↓                 ↓                 ↓
    [Creates]         [Invited To]    [Collaborates On]
         │                 │                 │
    ProductionTeam    TeamInvitation    FilmProject
         │                 │                 │
    [Contains]         [For Team]       [In Team]
         │                 ↓                 │
         │            ProductionTeam        │
         │                                  │
         └──────────────┬───────────────────┘
                        │
                  [Defines Roles]
                        │
                        ↓
                    Roles[] (embedded)
                        │
                  [Auto-generates]
                        │
                        ↓
                   CastingCall


DETAILED VIEW:

┌─────────────────────────────────────────────────────────────────┐
│ ProductionTeam                                                  │
├─────────────────────────────────────────────────────────────────┤
│ owner → User                                                    │
│ members[].user → User                                           │
│                                                                 │
│ ← CreatedBy (User)                                              │
│ ← HasProjects (FilmProject[])                                   │
│ ← HasInvitations (TeamInvitation[])                             │
│ ← HasCastings (CastingCall[])                                   │
└────┬────────────────────────────────────────────────────────────┘
     │
     └→ FilmProject
        ├─ team → ProductionTeam
        ├─ createdBy → User
        ├─ collaborators → User[]
        ├─ roles[]:
        │  ├─ roleName, roleType, ageMin/Max, gender
        │  ├─ skillsRequired[], experienceLevel
        │  └─ castingCallId → CastingCall
        │
        └→ CastingCall (auto-generated)
           ├─ project → FilmProject
           ├─ team → ProductionTeam
           ├─ producer → User
           ├─ Inherits from role: title, age, gender, skills, exp
           ├─ Dates: deadline, audition, shootStart, shootEnd
           └─ status: open | closed | filled

Separate:

TeamInvitation
├─ team → ProductionTeam
├─ invitedBy → User
├─ invitee → User
├─ project → FilmProject (optional)
├─ role: Recruiter | Viewer
├─ status: pending | accepted | rejected | expired
└─ token: unique invitation token (48hr expiry)
```

---

## 8. Status Enums

### FilmProject.status
```javascript
{
  'draft':    'Project created, not yet launched',
  'active':   'Project launched, accepting applications',
  'archived': 'Project completed or cancelled'
}
```

### CastingCall.status
```javascript
{
  'open':   'Accepting applications',
  'closed': 'No longer accepting',
  'filled': 'All positions filled'
}
```

### TeamInvitation.status
```javascript
{
  'pending':   'Waiting for invitee to respond (< 48hrs)',
  'accepted':  'Invitee accepted, now team member',
  'rejected':  'Invitee rejected invitation',
  'expired':   'Invitation expired (> 48hrs)'
}
```

---

## 9. Field Validation Rules

### ProductionTeam
| Field | Type | Min | Max | Required | Unique |
|-------|------|-----|-----|----------|--------|
| name | String | 1 | 120 | ✓ | - |
| productionHouse | String | - | 120 | - | - |
| description | String | - | 500 | - | - |
| owner | ObjectId | - | - | ✓ | - |

### FilmProject
| Field | Type | Min | Max | Required | Unique |
|-------|------|-----|-----|----------|--------|
| name | String | 1 | 150 | ✓ | - |
| genre | String | - | 60 | - | - |
| language | String | - | 60 | - | - |
| location | String | - | 120 | - | - |
| description | String | - | 800 | - | - |
| team | ObjectId | - | - | ✓ | - |
| createdBy | ObjectId | - | - | ✓ | - |

### Role (in FilmProject.roles[])
| Field | Type | Min | Max | Required | Notes |
|-------|------|-----|-----|----------|-------|
| roleName | String | 1 | - | ✓ | - |
| ageMin | Number | 1 | 120 | - | Must be ≤ ageMax |
| ageMax | Number | 1 | 120 | - | Must be ≥ ageMin |
| numberOfOpenings | Number | 1 | - | - | Default: 1 |
| physicalTraits | String | - | 300 | - | - |
| roleDescription | String | - | 500 | - | - |

### TeamInvitation
| Field | Type | Min | Max | Required | Unique |
|-------|------|-----|-----|----------|--------|
| team | ObjectId | - | - | ✓ | - |
| invitee | ObjectId | - | - | ✓ | - |
| invitedBy | ObjectId | - | - | ✓ | - |
| token | String | - | - | ✓ | ✓ |

---

## 10. Query Performance Considerations

### Common Queries & Indexes

**Find all teams for user**
```javascript
// Query
find({ $or: [{ owner: userId }, { 'members.user': userId }] })

// Indexes
owner: 1
'members.user': 1
```

**Find all projects in team**
```javascript
// Query
find({ team: teamId })

// Indexes
team: 1
```

**Find user's projects**
```javascript
// Query
find({ collaborators: userId })

// Indexes
collaborators: 1
```

**Find active castings**
```javascript
// Query
find({ status: 'open', submissionDeadline: { $gte: now } })

// Indexes
status: 1, submissionDeadline: 1
```

**Find pending invitations**
```javascript
// Query
find({ invitee: userId, status: 'pending', expiresAt: { $gt: now } })

// Indexes
invitee: 1, status: 1
```

---

## 11. Data Constraints

### Reference Integrity
- Deleting user: Cascade delete invitations where user is invitee
- Deleting team: Cascade delete all projects in team, all castings
- Deleting project: Cascade delete all castings for project
- Deleting role: Auto-delete or keep casting call reference?

### Business Logic Constraints
- Team owner cannot be removed from members
- Invitee cannot already be team member
- Project must belong to a team
- Casting must have valid reference to project
- Role must have valid date range (min ≤ max)

---

## 12. Scalability Notes

### Collection Sizes (Estimated at Scale)
- Users: 100,000+
- Production Teams: 10,000+
- Projects: 50,000+
- Castings: 100,000+
- Team Invitations: 200,000+ (many will expire)

### Optimization Strategies
1. Archive old projects to separate collection
2. Clean up expired invitations periodically
3. Cache team member lists
4. Denormalize project/team info in castings
5. Use pagination for listing APIs

---

## Summary

This data model provides:
- ✅ Clear ownership and permissions
- ✅ Efficient querying with proper indexes
- ✅ Referential integrity
- ✅ Automatic casting generation
- ✅ Token-based invitation system
- ✅ Status tracking for projects
- ✅ Collaborative project management

All relationships support the complete project creation and team collaboration workflow.
