# Casting & Project Creation System

## Overview

The Actory platform implements a sophisticated **two-tier casting system** that seamlessly integrates film projects with casting calls. This document provides a comprehensive guide to understanding how projects, roles, and casting calls work together.

---

## Table of Contents

1. [Data Models](#data-models)
2. [Project Creation Flow](#project-creation-flow)
3. [Casting Creation Methods](#casting-creation-methods)
4. [Date Validation System](#date-validation-system)
5. [Authorization Levels](#authorization-levels)
6. [Query & Filter Capabilities](#query--filter-capabilities)
7. [Update & Delete Operations](#update--delete-operations)
8. [Integration Points](#integration-points)
9. [API Endpoints](#api-endpoints)

---

## Data Models

### FilmProject Model

**File:** `actory-spotlight-backend/models/FilmProject.js`

```javascript
{
  team: ObjectId (ref: ProductionTeam) - REQUIRED,
  name: String (max 150) - REQUIRED,
  genre: String (max 60),
  language: String (max 60),
  location: String (max 120),
  startDate: Date,
  endDate: Date,
  description: String (max 800),
  createdBy: ObjectId (ref: User) - REQUIRED,
  collaborators: [ObjectId] (ref: User),
  roles: [RoleSchema],
  status: 'draft' | 'active' | 'archived' (default: 'draft'),
  timestamps: true
}
```

**Role Schema (Embedded):**
```javascript
{
  roleName: String (min 2) - REQUIRED,
  roleType: 'Lead' | 'Supporting' | 'Guest' | 'Extra',
  ageMin: Number (1-120),
  ageMax: Number (1-120),
  gender: 'Male' | 'Female' | 'Any',
  physicalTraits: String (max 300),
  skillsRequired: [String],
  experienceLevel: 'Beginner' | 'Intermediate' | 'Professional',
  roleDescription: String (max 500),
  numberOfOpenings: Number (min 1),
  castingCallId: ObjectId (ref: CastingCall) - Links to casting
}
```

**Key Features:**
- Projects belong to teams (multi-user collaboration)
- Roles are embedded subdocuments within projects
- Bi-directional linking between roles and casting calls
- Indexed by team and collaborators for fast queries

---

### CastingCall Model

**File:** `actory-spotlight-backend/models/CastingCall.js`

```javascript
{
  // Role Details
  roleTitle: String (min 2) - REQUIRED,
  description: String (max 500) - REQUIRED,
  
  // Requirements
  ageRange: {
    min: Number (1-120) - REQUIRED,
    max: Number (1-120) - REQUIRED (must be >= min)
  },
  heightRange: {
    min: Number (50-300 cm),
    max: Number (50-300 cm, must be >= min)
  },
  genderRequirement: 'male' | 'female' | 'any' | 'other' - REQUIRED,
  experienceLevel: 'beginner' | 'intermediate' | 'professional' - REQUIRED,
  skills: [String] - REQUIRED (min 1 skill),
  
  // Logistics
  location: String - REQUIRED,
  numberOfOpenings: Number (min 1) - REQUIRED,
  
  // Critical Dates (Strictly Validated)
  submissionDeadline: Date - REQUIRED,
  auditionDate: Date - REQUIRED,
  shootStartDate: Date - REQUIRED,
  shootEndDate: Date - REQUIRED,
  
  // References
  producer: ObjectId (ref: User) - REQUIRED,
  project: ObjectId (ref: FilmProject) - OPTIONAL,
  projectRole: ObjectId - OPTIONAL,
  team: ObjectId (ref: ProductionTeam) - OPTIONAL,
  
  createdAt: Date (auto)
}
```

**Key Features:**
- Can exist independently OR linked to a project
- Strict date validation with custom validators
- TTL index auto-expires castings after shootEndDate
- Comprehensive validation on create and update

---

## Project Creation Flow

**Endpoint:** `POST /api/v1/projects`

**Controller:** `actory-spotlight-backend/controllers/projects.js` → `createProject()`

### Step-by-Step Process

#### 1. **Authorization Check**
```javascript
// User must be team member (owner or member)
const team = await ProductionTeam.findById(teamId);
if (!isTeamMember(team, req.user._id)) {
  return 403; // Not authorized
}
```

#### 2. **Project Creation**
```javascript
const project = await FilmProject.create({
  team: teamId,
  name, genre, language, location,
  startDate, endDate, description,
  createdBy: req.user._id,
  collaborators: [req.user._id], // Creator auto-added
  roles: roles || []
});
```

#### 3. **Automatic Casting Generation** (Non-blocking Background Process)

For **each role** in the project:

```javascript
// Calculate intelligent date defaults
const submissionDeadline = now + 7 days;
const auditionDate = now + 14 days;
const shootStartDate = project.startDate || auditionDate;
const shootEndDate = project.endDate || (shootStartDate + 7 days);

// Build skills array (default to "Acting" if empty)
const skills = role.skillsRequired || ['Acting'];

// Age range with safe defaults
const ageMin = role.ageMin || 18;
const ageMax = role.ageMax || Math.max(ageMin, 60);

// Create casting call
const casting = await CastingCall.create({
  roleTitle: role.roleName,
  description: role.roleDescription || `Looking for ${role.roleType} actor`,
  ageRange: { min: ageMin, max: ageMax },
  genderRequirement: role.gender?.toLowerCase() || 'any',
  experienceLevel: role.experienceLevel?.toLowerCase() || 'beginner',
  location: project.location || 'TBD',
  numberOfOpenings: role.numberOfOpenings || 1,
  skills: skills,
  auditionDate, submissionDeadline,
  shootStartDate, shootEndDate,
  producer: req.user._id,
  project: project._id,
  projectRole: role._id,
  team: team._id
});

// Link back to role
role.castingCallId = casting._id;
```

#### 4. **Bi-directional Linking**
- CastingCall stores: `project`, `projectRole`, `team` references
- Role gets updated with: `castingCallId`

#### 5. **Team Notifications**
All team members (except creator) receive notification:
```javascript
{
  title: 'New project created',
  message: `${project.name} was created in team ${team.name}`,
  type: 'project'
}
```

---

## Casting Creation Methods

### Method A: Standalone Casting Call

**Endpoint:** `POST /api/v1/casting`

**Use Case:** Quick, independent casting not tied to a project

**Requirements:**
- All fields manually provided
- No project association
- Producer/ProductionTeam role required

**Example Request:**
```json
{
  "roleTitle": "Lead Actor",
  "description": "Looking for experienced lead for drama film",
  "ageRange": { "min": 25, "max": 40 },
  "genderRequirement": "any",
  "experienceLevel": "professional",
  "location": "Mumbai",
  "numberOfOpenings": 1,
  "skills": ["Acting", "Dramatic Performance"],
  "auditionDate": "2026-02-15T10:00:00Z",
  "submissionDeadline": "2026-02-01T23:59:59Z",
  "shootStartDate": "2026-03-01T00:00:00Z",
  "shootEndDate": "2026-04-15T00:00:00Z"
}
```

---

### Method B: Auto-generated from Project

**Trigger:** Creating a project with roles

**Process:**
1. Project creation returns immediately (non-blocking)
2. Background process creates casting calls
3. Each role → one casting call
4. Intelligent date calculation
5. Safe defaults for missing fields

**Advantages:**
- Fast project creation
- No manual casting setup
- Consistent data structure
- Automatic linking

---

### Method C: Manual from Specific Role

**Endpoint:** `POST /api/v1/projects/:id/roles/:roleId/casting`

**Use Case:** Create casting for existing role with custom parameters

**Process:**
1. Fetch project and verify team membership
2. Find specific role by ID
3. Merge role data with custom casting data
4. Create casting call
5. Update role with castingCallId
6. Notify team members

**Example Request:**
```json
{
  "roleId": "role-id-here",
  "castingData": {
    "description": "Custom description override",
    "auditionDate": "2026-02-20T10:00:00Z",
    "submissionDeadline": "2026-02-10T23:59:59Z",
    "shootStartDate": "2026-03-05T00:00:00Z",
    "shootEndDate": "2026-04-20T00:00:00Z",
    "location": "Custom location",
    "skills": ["Custom", "Skills"]
  }
}
```

---

## Date Validation System

### Critical Date Order

**STRICT REQUIREMENT:**
```
NOW < submissionDeadline < auditionDate < shootStartDate < shootEndDate
```

### Validation Points

#### 1. **Model-Level Validators** (CastingCall Schema)

```javascript
submissionDeadline: {
  validate: {
    validator: function(v) {
      return v >= new Date() && v <= this.auditionDate;
    },
    message: 'Deadline must be future and before audition'
  }
}

shootStartDate: {
  validate: {
    validator: function(v) {
      return v >= this.auditionDate;
    },
    message: 'Shoot start must be after audition'
  }
}
```

#### 2. **Pre-Save Hook**

```javascript
CastingCallSchema.pre('save', function(next) {
  const error = validateDates(
    this.submissionDeadline,
    this.auditionDate,
    this.shootStartDate,
    this.shootEndDate
  );
  if (error) return next(new Error(error));
  next();
});
```

#### 3. **Pre-Update Hook**

```javascript
CastingCallSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const current = await this.model.findOne(this.getQuery());
  
  // Merge current + updated values
  const mergedDates = { ...current, ...update };
  
  const error = validateDates(mergedDates);
  if (error) return next(new Error(error));
  next();
});
```

#### 4. **TTL Index** (Auto-cleanup)

```javascript
// Automatically remove castings after shoot end date
CastingCallSchema.index({ shootEndDate: 1 }, { expireAfterSeconds: 0 });
```

---

## Authorization Levels

### Public Access

**What:** View active casting calls

**Endpoint:** `GET /api/v1/casting`

**Authorization:** None required (public)

**Filters Applied:**
- `auditionDate >= NOW`
- `submissionDeadline >= NOW`

**Query Parameters:**
- `experienceLevel` - Filter by experience
- `genderRequirement` - Filter by gender
- `location` - Regex search on location
- `producer` - Filter by producer ID

---

### Producer/ProductionTeam Access

**Required Role:** `Producer` or `ProductionTeam`

**Capabilities:**
1. Create standalone casting calls
2. View all own casting calls (including past)
3. Update own casting calls (before deadline)
4. Delete own casting calls (before deadline)

**Endpoints:**
- `POST /api/v1/casting` - Create
- `GET /api/v1/casting/producer` - View all own
- `PUT /api/v1/casting/:id` - Update
- `DELETE /api/v1/casting/:id` - Delete

---

### Team Member Access

**Required:** Team membership (owner or member)

**Capabilities:**
1. View all team project castings (past & future)
2. Create projects (auto-generates castings)
3. Add roles to projects
4. Create castings from roles

**Endpoints:**
- `GET /api/v1/casting/team/:teamId` - View team castings
- `POST /api/v1/projects` - Create project
- `POST /api/v1/projects/:id/roles` - Add role
- `POST /api/v1/projects/:id/roles/:roleId/casting` - Create casting

---

## Query & Filter Capabilities

### Public Casting Search

**Endpoint:** `GET /api/v1/casting`

**Available Filters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `experienceLevel` | String | Exact match | `?experienceLevel=professional` |
| `genderRequirement` | String | Exact match | `?genderRequirement=female` |
| `location` | String | Regex (case-insensitive) | `?location=mumbai` |
| `producer` | ObjectId | Exact match | `?producer=60a7b...` |

**Default Behavior:**
- Only future castings (dates >= NOW)
- Sorted by `submissionDeadline` (ascending)
- Populates `producer` and `project` references

**Example Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "_id": "...",
      "roleTitle": "Lead Actor",
      "description": "...",
      "ageRange": { "min": 25, "max": 40 },
      "genderRequirement": "any",
      "experienceLevel": "professional",
      "location": "Mumbai",
      "numberOfOpenings": 1,
      "skills": ["Acting", "Dancing"],
      "auditionDate": "2026-02-15T10:00:00Z",
      "submissionDeadline": "2026-02-01T23:59:59Z",
      "shootStartDate": "2026-03-01T00:00:00Z",
      "shootEndDate": "2026-04-15T00:00:00Z",
      "producer": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "project": {
        "_id": "...",
        "name": "Drama Film Title",
        "description": "..."
      }
    }
  ]
}
```

---

### Team Castings Query

**Endpoint:** `GET /api/v1/casting/team/:teamId`

**Authorization:** Must be team member

**Returns:** All castings for team's projects (no date filter)

**Sorting:** By creation date (newest first)

---

### Producer's Castings Query

**Endpoint:** `GET /api/v1/casting/producer`

**Authorization:** Producer/ProductionTeam role

**Returns:** All castings created by logged-in user (no date filter)

**Sorting:** By creation date (newest first)

---

## Update & Delete Operations

### Update Casting Call

**Endpoint:** `PUT /api/v1/casting/:id`

**Authorization:**
1. Must be casting creator (`castingCall.producer === req.user.id`)
2. Submission deadline must NOT have passed

**Restrictions:**
```javascript
if (castingCall.submissionDeadline < new Date()) {
  return 400; // Cannot update after deadline
}
```

**Allowed Updates:**
- All fields (roleTitle, description, requirements, dates, etc.)
- Date updates must maintain validation order
- Auto-converts types (strings to numbers/arrays)

**Example Request:**
```json
{
  "roleTitle": "Updated Title",
  "ageRange": { "min": 30, "max": 45 },
  "auditionDate": "2026-02-20T10:00:00Z"
}
```

---

### Delete Casting Call

**Endpoint:** `DELETE /api/v1/casting/:id`

**Authorization:**
1. Must be casting creator
2. Submission deadline must NOT have passed

**Restrictions:**
```javascript
if (castingCall.submissionDeadline < new Date()) {
  return 400; // Cannot delete after deadline
}
```

**Behavior:**
- Permanently removes casting call
- Does NOT remove linked project/role
- Role's `castingCallId` becomes orphaned

---

### Update Project

**Endpoint:** `PUT /api/v1/projects/:id`

**Authorization:** Team member only

**Allowed Updates:**
- Basic info (name, genre, language, location, dates, description)
- Status (draft/active/archived)
- Roles array (add, modify, remove)

**Notifications:** All team members notified of update

**Note:** Updating project does NOT auto-update existing casting calls

---

### Delete Project

**Endpoint:** `DELETE /api/v1/projects/:id`

**Authorization:** Only project creator (not just team member)

**Cascade Behavior:**
```javascript
// Delete all related casting calls
await CastingCall.deleteMany({ project: project._id });

// Delete project
await project.deleteOne();
```

**Notifications:** All team members notified of deletion

---

## Integration Points

### 1. Teams Integration

**Purpose:** Multi-user collaboration on projects

**Flow:**
```
Team → Multiple Projects → Multiple Roles → Multiple Castings
```

**Access Control:**
- Team owner/members can create projects
- Projects belong to team
- All team members can manage project castings

---

### 2. Notifications Integration

**Automatic Notifications Sent For:**

| Event | Recipients | Trigger |
|-------|-----------|---------|
| Project Created | All team members (except creator) | `createProject()` |
| Project Updated | All team members (except updater) | `updateProject()` |
| Project Deleted | All team members (except deleter) | `deleteProject()` |
| Role Added | All team members (except adder) | `addRole()` |
| Casting Created | All team members (except creator) | `createCastingFromRole()` |

**Notification Structure:**
```javascript
{
  user: userId,
  title: "Event Title",
  message: "Detailed message",
  type: 'project' | 'role' | 'casting',
  relatedId: ObjectId,
  relatedType: 'film-project' | 'casting-call'
}
```

---

### 3. Videos Integration

**Nested Route:** `/api/v1/casting/:castingCallId/videos`

**Purpose:** Actor video submissions for casting calls

**Integration:**
- Videos reference casting call
- Can be filtered by casting call
- Part of application/audition process

---

### 4. Auto-cleanup System

**TTL Index on CastingCall:**
```javascript
{ shootEndDate: 1 }, { expireAfterSeconds: 0 }
```

**Behavior:**
- MongoDB automatically removes documents
- Happens shortly after `shootEndDate` passes
- No manual cleanup required
- Keeps database lean

---

## API Endpoints

### Casting Endpoints

| Method | Endpoint | Auth | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/v1/casting` | Public | All | Get active casting calls |
| GET | `/api/v1/casting/producer` | Required | Producer/Team | Get own castings |
| GET | `/api/v1/casting/team/:teamId` | Required | Team Members | Get team castings |
| GET | `/api/v1/casting/:id` | Public | All | Get single casting |
| POST | `/api/v1/casting` | Required | Producer/Team | Create casting |
| PUT | `/api/v1/casting/:id` | Required | Creator Only | Update casting |
| DELETE | `/api/v1/casting/:id` | Required | Creator Only | Delete casting |

---

### Project Endpoints

| Method | Endpoint | Auth | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/v1/projects` | Required | Producer/Team | Get accessible projects |
| GET | `/api/v1/projects/:id` | Required | Team Members | Get single project |
| POST | `/api/v1/projects` | Required | Producer/Team | Create project |
| PUT | `/api/v1/projects/:id` | Required | Team Members | Update project |
| DELETE | `/api/v1/projects/:id` | Required | Creator Only | Delete project |
| POST | `/api/v1/projects/:id/roles` | Required | Team Members | Add role to project |
| POST | `/api/v1/projects/:id/roles/:roleId/casting` | Required | Team Members | Create casting from role |

---

## Best Practices

### For Frontend Developers

1. **Always validate dates on client side** before submission
2. **Use date pickers** with min/max constraints to prevent invalid dates
3. **Show deadline status** clearly to users (can/cannot edit)
4. **Handle 400 errors** for deadline-passed operations gracefully
5. **Poll for casting status** if displaying countdowns
6. **Show team context** when viewing projects/castings

### For Backend Developers

1. **Never bypass date validation** - it's critical for data integrity
2. **Use transactions** when creating multiple related documents
3. **Always check team membership** before project operations
4. **Handle TTL cleanup** by not hard-referencing expired castings
5. **Log errors** in background casting generation for debugging
6. **Maintain bi-directional links** between projects and castings

### For API Consumers

1. **Filter castings** by location/experience on client when possible
2. **Cache team data** to reduce repeated queries
3. **Subscribe to notifications** for real-time updates
4. **Handle null castingCallId** in roles (might be deleted/expired)
5. **Respect pagination** on large casting lists
6. **Use query parameters** for filtering instead of client-side filtering

---

## Troubleshooting

### Common Issues

**Issue:** "Submission deadline must be before audition date"
- **Cause:** Date order violation
- **Fix:** Ensure dates follow: submission < audition < shootStart < shootEnd

**Issue:** "Cannot update casting call after deadline"
- **Cause:** Attempting to modify past casting
- **Fix:** Check current date vs submission deadline before attempting update

**Issue:** "Not authorized for this team"
- **Cause:** User not in team members list
- **Fix:** Verify team membership or send/accept invitation

**Issue:** "Casting call not found"
- **Cause:** TTL index expired the document
- **Fix:** Check shootEndDate - casting may have auto-deleted

**Issue:** "Background casting generation failed"
- **Cause:** Invalid role data or missing fields
- **Fix:** Check server logs for specific role that failed, ensure all required fields present

---

## Database Indexes

### CastingCall Indexes

```javascript
{ shootEndDate: 1 }  // TTL index for auto-cleanup
{ producer: 1 }      // Fast producer queries
{ team: 1 }          // Fast team queries
{ project: 1 }       // Fast project queries
```

### FilmProject Indexes

```javascript
{ team: 1 }              // Fast team queries
{ collaborators: 1 }     // Fast collaborator queries
```

---

## Conclusion

The Actory casting and project system is designed for:

✅ **Scalability** - Background processing, indexed queries
✅ **Data Integrity** - Strict validation, bi-directional linking
✅ **User Experience** - Auto-generation, intelligent defaults
✅ **Collaboration** - Team-based access, notifications
✅ **Flexibility** - Multiple creation methods, optional project linking
✅ **Maintenance** - Auto-cleanup, comprehensive error handling

This system supports the complete lifecycle from project conception to casting to production! 🎬
