# Authorization & Team Collaboration System

## Overview

The Actory platform implements a comprehensive **multi-tenant authorization system** with role-based access control (RBAC), team-based collaboration, and secure resource isolation. This document details all authentication, authorization, and collaboration mechanisms.

---

## Table of Contents

1. [User Roles & Types](#user-roles--types)
2. [Authentication System](#authentication-system)
3. [Authorization Middleware](#authorization-middleware)
4. [Team Structure](#team-structure)
5. [Authorization Patterns](#authorization-patterns)
6. [Team Operations](#team-operations)
7. [Project Authorization](#project-authorization)
8. [Casting Authorization](#casting-authorization)
9. [Team Invitation System](#team-invitation-system)
10. [Mixed User Type Support](#mixed-user-type-support)
11. [Security Features](#security-features)
12. [API Reference](#api-reference)

---

## User Roles & Types

### Entity Types

The system supports **two distinct user entity types**:

#### 1. User Model

**File:** `actory-spotlight-backend/models/User.js`

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'Actor' | 'Producer' | 'ProductionTeam' | 'Admin',
  
  // Actor-specific fields
  age: Number,
  gender: String,
  experienceLevel: String,
  videos: [VideoSchema],
  
  // Producer-specific fields
  companyName: String,
  website: String,
  establishedYear: Number,
  teamSize: String,
  specializations: [String],
  
  isVerified: Boolean,
  isEmailVerified: Boolean
}
```

**Roles:**
- **Actor** - Can view castings, submit auditions, manage profile
- **Producer** - Can create teams, projects, castings
- **ProductionTeam** - For users associated with production houses
- **Admin** - Full system access, can manage all resources

#### 2. ProductionHouse Model

**File:** `actory-spotlight-backend/models/ProductionHouse.js`

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  companyName: String,
  phone: String,
  location: String,
  website: String,
  
  role: 'ProductionTeam' (fixed),
  
  establishedYear: Number,
  teamSize: String,
  specializations: [String],
  
  isVerified: Boolean,
  isEmailVerified: Boolean
}
```

**Key Differences:**
- ProductionHouse is a separate collection from User
- Always has role `ProductionTeam`
- Designed for company accounts vs individual producers
- Can participate in teams alongside User entities

---

## Authentication System

### JWT-Based Authentication

**File:** `actory-spotlight-backend/middleware/auth.js`

#### Token Structure

```javascript
// For User
{
  id: userId,
  // type field omitted or undefined
}

// For ProductionHouse
{
  id: productionHouseId,
  type: 'ProductionHouse'
}
```

#### Token Sources (Priority Order)

1. **Authorization Header** (Primary)
   ```
   Authorization: Bearer <token>
   ```

2. **Query Parameter** (Fallback for file streams)
   ```
   GET /api/resource?token=<token>
   ```

3. **Cookies** (Currently disabled)
   ```javascript
   // Commented out in code
   // req.cookies.token
   ```

### Authentication Flow

```
1. Extract token from request
   ↓
2. Verify JWT signature
   ↓
3. Decode payload
   ↓
4. Check token type:
   - If type === 'ProductionHouse' → Load ProductionHouse
   - Else → Load User
   ↓
5. Set req.user with loaded entity
   ↓
6. Add role and isProductionHouse flag
   ↓
7. Continue to next middleware
```

---

## Authorization Middleware

### 1. `protect` Middleware

**Purpose:** Require valid authentication for route access

**File:** `middleware/auth.js` (Lines 6-50)

**Implementation:**
```javascript
exports.protect = async (req, res, next) => {
  let token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type === 'ProductionHouse') {
      req.user = await ProductionHouse.findById(decoded.id);
      req.user.role = 'ProductionTeam';
      req.user.isProductionHouse = true;
    } else {
      req.user = await User.findById(decoded.id);
    }
    
    if (!req.user) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};
```

**Usage:**
```javascript
router.get('/protected', protect, controller.method);
```

---

### 2. `optionalAuth` Middleware

**Purpose:** Set user context if token exists, but don't require it

**File:** `middleware/auth.js` (Lines 52-100)

**Use Cases:**
- Public endpoints that benefit from user context
- Mixed access endpoints (different behavior for logged-in users)
- Analytics tracking with optional user identification

**Implementation:**
```javascript
exports.optionalAuth = async (req, res, next) => {
  let token = extractToken(req);
  
  if (!token) {
    return next(); // Continue without req.user
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Same loading logic as protect
    // ...
    next(); // Continue even if user not found
  } catch (err) {
    next(); // Continue without req.user on error
  }
};
```

**Usage:**
```javascript
router.get('/public', optionalAuth, controller.method);
```

---

### 3. `authorize(...roles)` Middleware

**Purpose:** Role-based access control

**File:** `middleware/auth.js` (Lines 103-109)

**Implementation:**
```javascript
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized` 
      });
    }
    next();
  };
};
```

**Usage:**
```javascript
// Single role
router.post('/admin', protect, authorize('Admin'), controller.method);

// Multiple roles
router.post('/casting', 
  protect, 
  authorize('Producer', 'ProductionTeam', 'Admin'), 
  controller.createCasting
);
```

---

## Team Structure

### ProductionTeam Model

**File:** `actory-spotlight-backend/models/ProductionTeam.js`

```javascript
{
  name: String (max 120) - REQUIRED,
  productionHouse: String (max 120),
  description: String (max 500),
  
  owner: ObjectId (ref: User | ProductionHouse) - REQUIRED,
  
  members: [
    {
      user: ObjectId (ref: User | ProductionHouse),
      role: 'Owner' | 'Recruiter' | 'Viewer',
      addedAt: Date (auto)
    }
  ],
  
  timestamps: true
}
```

**Indexes:**
```javascript
{ owner: 1 }           // Fast owner lookups
{ 'members.user': 1 }  // Fast member lookups
```

### Member Roles

| Role | Permissions | Can Invite | Can Remove | Can Update Team |
|------|-------------|------------|------------|-----------------|
| **Owner** | Full control | ✅ | ✅ | ✅ |
| **Recruiter** | View/manage projects & castings | ❌ | ❌ | ❌ |
| **Viewer** | Read-only access | ❌ | ❌ | ❌ |

**Key Rules:**
- Only **one owner** per team (team creator)
- Owner **cannot be removed** from team
- Owner **cannot leave** team (must delete team instead)
- Members can leave voluntarily

---

## Authorization Patterns

### Helper Functions

#### 1. `isTeamMember` (Projects)

**File:** `controllers/projects.js` (Line 6)

```javascript
const isTeamMember = (team, userId) =>
  String(team.owner) === String(userId) || 
  team.members.some((m) => String(m.user) === String(userId));
```

**Purpose:** Quick membership check for project operations

**Returns:** `true` if user is owner OR in members array

---

#### 2. `isMember` (Teams - Robust Version)

**File:** `controllers/teams.js` (Lines 7-26)

```javascript
const isMember = (team, userId) => {
  if (!team || !userId) return false;
  const targetId = String(userId);

  // Check owner
  const ownerId = team.owner?._id 
    ? String(team.owner._id) 
    : String(team.owner);
  if (ownerId === targetId) return true;

  // Check members (handles populated/unpopulated refs)
  return team.members.some((m) => {
    const memberId = m.user?._id 
      ? String(m.user._id) 
      : String(m.user);
    return memberId === targetId;
  });
};
```

**Purpose:** Robust check handling populated and unpopulated references

**Handles:**
- Populated user objects (`{ _id: '...', name: '...' }`)
- Raw ObjectIds (`ObjectId('...')`)
- Mixed User/ProductionHouse references

---

#### 3. `isOwner` (Team Invitations)

**File:** `controllers/teamInvitations.js` (Line 6)

```javascript
const isOwner = (team, userId) => 
  String(team.owner) === String(userId);
```

**Purpose:** Owner-only operations (invitations, member removal)

---

## Team Operations

### Create Team

**Endpoint:** `POST /api/v1/teams`

**Authorization:** Producer, ProductionTeam, or Admin role

**Controller:** `controllers/teams.js` → `createTeam()`

**Logic:**
```javascript
const team = await ProductionTeam.create({
  name: name.trim(),
  productionHouse: productionHouse?.trim(),
  description: description?.trim(),
  owner: req.user._id,
  members: [
    { 
      user: req.user._id, 
      role: 'Owner' 
    }
  ] // Creator auto-added as Owner
});
```

**Key Points:**
- Creator becomes owner automatically
- Creator also added to members array with role 'Owner'
- No minimum/maximum member limits

---

### View Team

**Endpoint:** `GET /api/v1/teams/:id`

**Authorization:** Must be team member

**Controller:** `controllers/teams.js` → `getTeamById()`

**Logic:**
```javascript
const team = await ProductionTeam.findById(id);

if (!isMember(team, req.user._id)) {
  return res.status(403).json({
    success: false,
    message: 'Not authorized for this team'
  });
}

// Manual population to handle User/ProductionHouse mix
// ... (see Mixed User Type Support section)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Team Name",
    "description": "...",
    "owner": {
      "_id": "...",
      "name": "Owner Name",
      "email": "owner@example.com",
      "role": "Producer",
      "profileImage": "..."
    },
    "members": [
      {
        "user": {
          "_id": "...",
          "name": "Member Name",
          "email": "member@example.com",
          "role": "Producer"
        },
        "role": "Recruiter",
        "addedAt": "2026-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### Update Team

**Endpoint:** `PUT /api/v1/teams/:id`

**Authorization:** Owner only

**Controller:** `controllers/teams.js` → `updateTeam()`

**Logic:**
```javascript
const team = await ProductionTeam.findById(id);

if (String(team.owner) !== String(req.user._id)) {
  return res.status(403).json({ 
    success: false, 
    message: 'Only owner can update team' 
  });
}

// Update allowed fields
if (name) team.name = name.trim();
if (productionHouse !== undefined) team.productionHouse = productionHouse.trim();
if (description !== undefined) team.description = description.trim();

await team.save();
```

**Allowed Updates:**
- Team name
- Production house
- Description

**Not Allowed:**
- Owner change
- Member management (use separate endpoints)

---

### Remove Member

**Endpoint:** `DELETE /api/v1/teams/:id/members/:memberId`

**Authorization:** Owner only

**Controller:** `controllers/teams.js` → `removeMember()`

**Logic:**
```javascript
const team = await ProductionTeam.findById(id);

// Check owner
if (String(team.owner) !== String(req.user._id)) {
  return res.status(403).json({ 
    message: 'Only team owner can remove members' 
  });
}

// Prevent owner removal
if (String(memberId) === String(team.owner)) {
  return res.status(400).json({ 
    message: 'Owner cannot be removed' 
  });
}

// Remove from members array
team.members = team.members.filter(
  (m) => String(m.user) !== String(memberId)
);
await team.save();

// Notify removed member
await createNotification({
  user: memberId,
  title: 'Removed from team',
  message: `You have been removed from team ${team.name}`,
  type: 'team'
});
```

**Notifications:** Removed member receives notification

---

### Leave Team

**Endpoint:** `POST /api/v1/teams/:id/leave`

**Authorization:** Any member (except owner)

**Controller:** `controllers/teams.js` → `leaveTeam()`

**Logic:**
```javascript
const team = await ProductionTeam.findById(id);

// Owner cannot leave
if (String(team.owner) === String(req.user._id)) {
  return res.status(400).json({ 
    message: 'Owner cannot leave their own team' 
  });
}

// Remove self from members
team.members = team.members.filter(
  (m) => String(m.user) !== String(req.user._id)
);
await team.save();

// Notify owner
await createNotification({
  user: team.owner,
  title: 'Member left team',
  message: `${req.user.name} left ${team.name}`,
  type: 'team'
});
```

**Notifications:** Owner receives notification

---

### View My Teams

**Endpoint:** `GET /api/v1/teams`

**Authorization:** Producer, ProductionTeam, or Admin

**Controller:** `controllers/teams.js` → `getMyTeams()`

**Logic:**
```javascript
const teams = await ProductionTeam.find({
  $or: [
    { owner: req.user._id },
    { 'members.user': req.user._id }
  ]
}).sort({ createdAt: -1 });
```

**Returns:** All teams where user is owner OR member

---

## Project Authorization

### Authorization Layers

**Layer 1: Route-Level**

```javascript
// routes/projects.js
router.use(protect, authorize('Producer', 'ProductionTeam', 'Admin'));
```

All project routes require:
1. Valid authentication (`protect`)
2. Producer, ProductionTeam, or Admin role (`authorize`)

**Layer 2: Team Membership**

Every project operation checks team membership:

```javascript
const team = await ProductionTeam.findById(project.team);

if (!isTeamMember(team, req.user._id)) {
  return res.status(403).json({ 
    message: 'Not authorized for this team' 
  });
}
```

### Operation-Specific Authorization

#### Create Project

**Endpoint:** `POST /api/v1/projects`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ Team membership

```javascript
const team = await ProductionTeam.findById(teamId);

if (!isTeamMember(team, req.user._id)) {
  return 403; // Not authorized
}

const project = await FilmProject.create({
  team: teamId,
  createdBy: req.user._id,
  collaborators: [req.user._id]
  // ...
});
```

---

#### Update Project

**Endpoint:** `PUT /api/v1/projects/:id`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ Team membership

**Note:** Any team member can update (not just creator)

```javascript
const team = await ProductionTeam.findById(project.team);

if (!isTeamMember(team, req.user._id)) {
  return 403;
}

// Proceed with update
```

---

#### Delete Project

**Endpoint:** `DELETE /api/v1/projects/:id`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ **Must be project creator** (stricter than update)

```javascript
const isOwner = String(project.createdBy) === String(req.user._id);

if (!isOwner) {
  return res.status(403).json({ 
    message: 'Only the project owner can delete this project' 
  });
}

// Delete related castings
await CastingCall.deleteMany({ project: project._id });

// Delete project
await project.deleteOne();
```

**Cascade Behavior:**
- Deletes all casting calls linked to project
- Notifies all team members

---

#### Add Role to Project

**Endpoint:** `POST /api/v1/projects/:id/roles`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ Team membership

**Note:** Any team member can add roles

---

#### Create Casting from Role

**Endpoint:** `POST /api/v1/projects/:id/roles/:roleId/casting`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ Team membership

**Note:** Any team member can create castings for project roles

---

#### View Projects

**Endpoint:** `GET /api/v1/projects`

**Authorization:** Shows only accessible projects

```javascript
// Find all teams user can access
const accessibleTeams = await ProductionTeam.find({
  $or: [
    { owner: req.user._id },
    { 'members.user': req.user._id }
  ]
});

const teamIds = accessibleTeams.map(t => t._id);

// Filter projects by accessible teams
const projects = await FilmProject.find({ 
  team: { $in: teamIds } 
});
```

**Query Parameters:**
- `teamId` - Filter by specific team (if user has access)

---

#### View Single Project

**Endpoint:** `GET /api/v1/projects/:id`

**Requirements:**
1. ✅ Producer/ProductionTeam/Admin role
2. ✅ Team membership

```javascript
const project = await FilmProject.findById(id)
  .populate('team')
  .populate('createdBy')
  .populate('collaborators');

if (!isTeamMember(project.team, req.user._id)) {
  return 403;
}
```

---

## Casting Authorization

### Public vs Protected Operations

| Operation | Auth Required | Access Level | Restrictions |
|-----------|---------------|--------------|--------------|
| View All (Active) | ❌ No | Public | Only future castings |
| View Single | ❌ No | Public | None |
| View Team Castings | ✅ Yes | Team Members | All castings (past & future) |
| View Producer's Castings | ✅ Yes | Creator Only | All own castings |
| Create Standalone | ✅ Yes | Producer/ProdTeam | None |
| Create from Role | ✅ Yes | Team Members | Must be in project team |
| Update | ✅ Yes | Creator Only | Before submission deadline |
| Delete | ✅ Yes | Creator Only | Before submission deadline |

### View All Castings (Public)

**Endpoint:** `GET /api/v1/casting`

**Authorization:** None required

**Filters Applied Automatically:**
```javascript
const query = {
  $and: [
    { auditionDate: { $gte: now } },
    { submissionDeadline: { $gte: now } }
  ]
};
```

**Additional Filters (Query Params):**
- `producer` - Filter by producer ID
- `experienceLevel` - Filter by experience level
- `genderRequirement` - Filter by gender
- `location` - Regex search on location

---

### View Team Castings

**Endpoint:** `GET /api/v1/casting/team/:teamId`

**Authorization:** Team member only

```javascript
const team = await ProductionTeam.findById(teamId);

const isTeamMember = String(team.owner) === String(req.user.id) || 
  team.members.some(m => String(m.user) === String(req.user.id));

if (!isTeamMember) {
  return res.status(403).json({ 
    message: 'Not authorized to view this team\'s castings' 
  });
}

// Return all castings for team's projects (no date filter)
const castings = await CastingCall.find({ team: teamId });
```

---

### View Producer's Castings

**Endpoint:** `GET /api/v1/casting/producer`

**Authorization:** Producer/ProductionTeam role

```javascript
// Find all castings created by logged-in user
const castings = await CastingCall.find({ 
  producer: req.user.id 
});
```

**No date filtering** - shows all past and future castings

---

### Create Casting (Standalone)

**Endpoint:** `POST /api/v1/casting`

**Authorization:** Producer or ProductionTeam role

**Ownership:**
```javascript
const casting = await CastingCall.create({
  // ... all fields ...
  producer: req.user.id // Creator owns the casting
});
```

**Note:** Standalone castings have no team/project association

---

### Create Casting from Role

**Endpoint:** `POST /api/v1/projects/:id/roles/:roleId/casting`

**Authorization:** Team member only

```javascript
const team = await ProductionTeam.findById(project.team);

if (!isTeamMember(team, req.user._id)) {
  return 403;
}

const casting = await CastingCall.create({
  // ... role-based fields ...
  producer: req.user._id,
  project: project._id,
  projectRole: role._id,
  team: team._id
});
```

**Ownership:** Creator owns, but team/project linked

---

### Update Casting

**Endpoint:** `PUT /api/v1/casting/:id`

**Authorization:** Creator only + deadline check

```javascript
const casting = await CastingCall.findById(id);

// Check ownership
if (casting.producer.toString() !== req.user.id) {
  return res.status(401).json({ 
    message: 'Not authorized to update this casting call' 
  });
}

// Check deadline
if (casting.submissionDeadline < new Date()) {
  return res.status(400).json({
    message: 'Cannot update casting call after submission deadline'
  });
}

// Proceed with update
```

---

### Delete Casting

**Endpoint:** `DELETE /api/v1/casting/:id`

**Authorization:** Creator only + deadline check

```javascript
const casting = await CastingCall.findById(id);

// Check ownership
if (casting.producer.toString() !== req.user.id) {
  return res.status(401).json({ 
    message: 'Not authorized to delete this casting call' 
  });
}

// Check deadline
if (casting.submissionDeadline < new Date()) {
  return res.status(400).json({
    message: 'Cannot delete casting call after submission deadline'
  });
}

await CastingCall.findByIdAndDelete(id);
```

---

## Team Invitation System

### TeamInvitation Model

**File:** `actory-spotlight-backend/models/TeamInvitation.js`

```javascript
{
  team: ObjectId (ref: ProductionTeam) - REQUIRED,
  invitedBy: ObjectId (ref: User) - REQUIRED,
  invitee: ObjectId (ref: User) - REQUIRED,
  project: ObjectId (ref: FilmProject) - OPTIONAL,
  
  role: 'Recruiter' | 'Viewer' (default: 'Recruiter'),
  status: 'pending' | 'accepted' | 'rejected' | 'expired',
  
  token: String (auto-generated, indexed),
  expiresAt: Date - REQUIRED,
  
  timestamps: true
}
```

**Indexes:**
```javascript
{ invitee: 1, status: 1 }  // Fast invitee queries
{ team: 1, status: 1 }     // Fast team queries
{ token: 1 }               // Fast token lookups
```

---

### Send Invitation

**Endpoint:** `POST /api/v1/team-invitations/send`

**Authorization:** Team owner only

**Controller:** `controllers/teamInvitations.js` → `sendInvitation()`

**Process:**
```javascript
const team = await ProductionTeam.findById(teamId);

// Check ownership
if (!isOwner(team, req.user._id)) {
  return res.status(403).json({ 
    message: 'Only team owner can invite' 
  });
}

// Find invitee by email or ID
const invitee = inviteeId
  ? await User.findById(inviteeId)
  : await User.findOne({ email: inviteeEmail });

// Check if already member
const alreadyMember = String(team.owner) === String(invitee._id) ||
  team.members.some(m => String(m.user) === String(invitee._id));
  
if (alreadyMember) {
  return 400; // Already in team
}

// Create invitation (expires in 48 hours)
const invitation = await TeamInvitation.create({
  team: team._id,
  invitedBy: req.user._id,
  invitee: invitee._id,
  role: role || 'Recruiter',
  project: projectId,
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  token: crypto.randomBytes(16).toString('hex') // Auto-generated
});

// Notify invitee
await createNotification({
  user: invitee._id,
  title: 'Team invitation',
  message: `You have been invited to join ${team.name} as ${role}`,
  type: 'invite',
  metadata: { teamId: team._id, role }
});
```

**Request Body:**
```json
{
  "teamId": "team-id-here",
  "inviteeEmail": "user@example.com",  // OR inviteeId
  "role": "Recruiter",  // or "Viewer"
  "projectId": "optional-project-id"
}
```

---

### Accept Invitation

**Endpoint:** `POST /api/v1/team-invitations/accept`

**Authorization:** Must be the invitee

**Controller:** `controllers/teamInvitations.js` → `acceptInvitation()`

**Process:**
```javascript
// Find by token OR invitationId
const invitation = await TeamInvitation.findOne({ 
  token, 
  status: 'pending' 
}).populate('team');

// Verify invitee
if (String(invitation.invitee) !== String(req.user._id)) {
  return res.status(403).json({ 
    message: 'Not your invitation' 
  });
}

// Check expiration
if (invitation.expiresAt < new Date()) {
  invitation.status = 'expired';
  await invitation.save();
  return res.status(400).json({ 
    message: 'Invitation expired' 
  });
}

// Add to team (if not already member)
const team = invitation.team;
const alreadyMember = String(team.owner) === String(req.user._id) ||
  team.members.some(m => String(m.user) === String(req.user._id));

if (!alreadyMember) {
  team.members.push({ 
    user: req.user._id, 
    role: invitation.role 
  });
  await team.save();
}

// Update invitation status
invitation.status = 'accepted';
await invitation.save();

// Notify inviter
await createNotification({
  user: invitation.invitedBy,
  title: 'Invitation accepted',
  message: `${req.user.name} accepted your invite to ${team.name}`
});
```

**Request Body:**
```json
{
  "token": "invitation-token-here"
  // OR
  "invitationId": "invitation-id-here"
}
```

---

### Reject Invitation

**Endpoint:** `POST /api/v1/team-invitations/reject`

**Authorization:** Must be the invitee

**Process:**
```javascript
// Similar to accept, but:
invitation.status = 'rejected';
await invitation.save();

// Notify inviter
await createNotification({
  user: invitation.invitedBy,
  title: 'Invitation rejected',
  message: `${req.user.name} rejected your invite`
});
```

---

### View Pending Invitations

**Endpoint:** `GET /api/v1/team-invitations/pending`

**Authorization:** Any authenticated user

**Returns:** All pending invitations for logged-in user

```javascript
const invitations = await TeamInvitation.find({ 
  invitee: req.user._id, 
  status: 'pending' 
})
.populate('team', 'name')
.sort({ createdAt: -1 });
```

---

## Mixed User Type Support

### Challenge

Teams can have both **User** and **ProductionHouse** entities as members. This requires special handling because:

1. They're stored in different collections
2. Mongoose `.populate()` only works on one reference model
3. Need to show consistent user info in responses

### Solution: Manual Population

**File:** `controllers/teams.js` → `getTeamById()`

**Implementation:**

```javascript
// 1. Fetch team WITHOUT populate
const team = await ProductionTeam.findById(id);

// 2. Try User collection first for owner
let ownerDoc = await User.findById(team.owner, 
  'name email role profileImage'
);

// 3. If not found, try ProductionHouse collection
if (!ownerDoc) {
  const ph = await ProductionHouse.findById(team.owner, 
    'companyName email role profileImage photo'
  );
  
  if (ph) {
    // Map ProductionHouse fields to User-like structure
    ownerDoc = {
      _id: ph._id,
      name: ph.companyName || ph.name || 'Production House',
      email: ph.email,
      role: ph.role || 'ProductionTeam',
      profileImage: ph.profileImage || ph.photo || ''
    };
  }
}

// 4. Repeat for each member
const populatedMembers = await Promise.all(
  team.members.map(async (member) => {
    let userDoc = await User.findById(member.user);
    
    if (!userDoc) {
      const ph = await ProductionHouse.findById(member.user);
      if (ph) {
        userDoc = {
          _id: ph._id,
          name: ph.companyName,
          email: ph.email,
          role: 'ProductionTeam',
          profileImage: ph.profileImage || ph.photo
        };
      }
    }
    
    return {
      ...member,
      user: userDoc || member.user
    };
  })
);
```

**Benefits:**
- Handles deleted users gracefully
- Supports both entity types
- Returns consistent user structure
- Prevents null reference errors

---

## Security Features

### ✅ Authentication Security

1. **JWT with Secret Key**
   - Configurable via `process.env.JWT_SECRET`
   - Tokens signed and verified
   - Payload tampering detected

2. **Password Hashing**
   - bcrypt with salt rounds
   - Passwords never stored in plain text
   - `select: false` on password field

3. **Token Expiration**
   - Configurable token lifetime
   - Expired tokens rejected automatically

4. **Multiple Token Sources**
   - Header (primary, most secure)
   - Query param (for file access only)
   - Cookies (disabled by default)

---

### ✅ Authorization Security

1. **Role-Based Access Control (RBAC)**
   - Middleware-enforced role checks
   - Multiple roles per route
   - Clear error messages on denial

2. **Resource Ownership Checks**
   - Castings: Only creator can update/delete
   - Projects: Only creator can delete
   - Teams: Only owner can update/remove members

3. **Team Membership Validation**
   - All team resources check membership
   - Owner and member checks
   - No unauthorized cross-team access

4. **Deadline-Based Restrictions**
   - Cannot modify castings after submission deadline
   - Prevents post-deadline manipulation
   - Maintains data integrity

---

### ✅ Invitation Security

1. **Secure Token Generation**
   - Crypto-random tokens (16 bytes)
   - Indexed for fast lookups
   - One-time use (status changes on accept/reject)

2. **Expiration Enforcement**
   - 48-hour expiration
   - Checked on every action
   - Auto-marked as expired

3. **Invitee Verification**
   - Must match logged-in user
   - Cannot accept others' invitations
   - Owner-only invitation sending

4. **Duplicate Prevention**
   - Checks existing membership before inviting
   - Checks membership before adding on accept
   - Prevents duplicate entries

---

### ✅ Data Isolation

1. **Multi-Tenant Architecture**
   - Teams provide data isolation
   - No cross-team data access
   - Clear ownership boundaries

2. **Query Filtering**
   - Projects filtered by accessible teams
   - Castings filtered by producer/team
   - Users only see own teams

3. **Reference Validation**
   - Validates team exists before operations
   - Validates user exists before adding
   - Handles deleted users gracefully

---

## API Reference

### Authentication Routes

```javascript
POST   /api/v1/auth/register          // Register new user
POST   /api/v1/auth/login             // Login (get JWT)
POST   /api/v1/auth/logout            // Logout (client-side token removal)
GET    /api/v1/auth/me                // Get current user
POST   /api/v1/auth/forgot-password   // Request password reset
PUT    /api/v1/auth/reset-password    // Reset password with token
```

---

### Team Routes

All require: `protect, authorize('Producer', 'ProductionTeam', 'Admin')`

```javascript
POST   /api/v1/teams                  // Create team
GET    /api/v1/teams                  // Get my teams
GET    /api/v1/teams/:id              // Get team by ID
PUT    /api/v1/teams/:id              // Update team (owner only)
DELETE /api/v1/teams/:id/members/:memberId  // Remove member (owner only)
POST   /api/v1/teams/:id/leave        // Leave team (non-owner)
```

---

### Team Invitation Routes

All require: `protect, authorize('Producer', 'ProductionTeam', 'Admin')`

```javascript
POST   /api/v1/team-invitations/send      // Send invitation (owner only)
POST   /api/v1/team-invitations/accept    // Accept invitation (invitee only)
POST   /api/v1/team-invitations/reject    // Reject invitation (invitee only)
GET    /api/v1/team-invitations/pending   // Get my pending invitations
```

---

### Project Routes

All require: `protect, authorize('Producer', 'ProductionTeam', 'Admin')`

```javascript
POST   /api/v1/projects                          // Create project (team member)
GET    /api/v1/projects                          // Get accessible projects
GET    /api/v1/projects/:id                      // Get project (team member)
PUT    /api/v1/projects/:id                      // Update project (team member)
DELETE /api/v1/projects/:id                      // Delete project (creator only)
POST   /api/v1/projects/:id/roles                // Add role (team member)
POST   /api/v1/projects/:id/roles/:roleId/casting  // Create casting from role
```

---

### Casting Routes

Mixed authentication:

```javascript
// Public routes (no auth)
GET    /api/v1/casting              // Get active castings
GET    /api/v1/casting/:id          // Get single casting

// Protected routes
GET    /api/v1/casting/producer     // Get own castings (producer)
GET    /api/v1/casting/team/:teamId // Get team castings (team member)
POST   /api/v1/casting              // Create casting (producer/team)
PUT    /api/v1/casting/:id          // Update casting (creator, before deadline)
DELETE /api/v1/casting/:id          // Delete casting (creator, before deadline)
```

---

## Authorization Flow Diagrams

### Team Access Flow

```
User Request → protect middleware
    ↓
Verify JWT → Load User/ProductionHouse
    ↓
authorize middleware → Check role
    ↓
Controller → Check team membership
    ↓
isMember/isTeamMember check
    ↓
✅ Authorized → Proceed
❌ Not Authorized → 403 Error
```

---

### Casting Access Flow

```
User Request
    ↓
Is it a view request?
    ├─ YES → No auth required (public)
    └─ NO → protect + authorize
        ↓
    Is it create/update/delete?
        ↓
    Check ownership (producer field)
        ↓
    If update/delete: Check deadline
        ↓
    ✅ All checks pass → Proceed
    ❌ Any check fails → 401/403/400
```

---

### Project Access Flow

```
User Request → protect + authorize
    ↓
Load project → Load team
    ↓
isTeamMember check
    ↓
Is it delete operation?
    ├─ YES → Check if creator
    └─ NO → Team member sufficient
        ↓
    ✅ Authorized → Proceed
    ❌ Not Authorized → 403 Error
```

---

## Best Practices

### For Frontend Developers

1. **Store JWT securely**
   - Use HttpOnly cookies (when enabled)
   - Or secure localStorage with XSS protection
   - Never expose in URL except for file access

2. **Handle 401/403 properly**
   - 401 → Redirect to login
   - 403 → Show "Access Denied" message
   - Clear token on 401

3. **Show role-based UI**
   - Hide features based on user role
   - Show owner-only actions to owners only
   - Disable expired invitation actions

4. **Check team membership**
   - Fetch user's teams on login
   - Cache team membership
   - Refresh on invitation accept

5. **Handle deadline restrictions**
   - Show "Expired" status for past-deadline castings
   - Disable edit/delete buttons after deadline
   - Show clear error messages

---

### For Backend Developers

1. **Always use authorization helpers**
   - Don't manually check `req.user.role`
   - Use `isTeamMember`, `isOwner`, etc.
   - Consistent checks across codebase

2. **Validate team existence**
   - Check team exists before operations
   - Handle null teams gracefully
   - Return clear error messages

3. **Handle mixed user types**
   - Use manual population for teams
   - Map ProductionHouse to User structure
   - Test with both entity types

4. **Secure invitation tokens**
   - Use crypto.randomBytes
   - Validate expiration on every use
   - Change status after use

5. **Audit authorization**
   - Log authorization failures
   - Monitor suspicious patterns
   - Review access logs regularly

---

## Troubleshooting

### "Not authorized to access this route" (401)

**Causes:**
- No token provided
- Invalid token
- Expired token
- User deleted

**Fix:**
- Re-login to get fresh token
- Check token format (must be `Bearer <token>`)
- Verify JWT_SECRET matches

---

### "User role X is not authorized" (403)

**Causes:**
- User has wrong role for endpoint
- Actor trying to access producer endpoint

**Fix:**
- Check user's role in database
- Use correct endpoint for role
- Request role change if needed

---

### "Not authorized for this team" (403)

**Causes:**
- User not in team members
- Team membership not updated after accepting invitation
- User removed from team

**Fix:**
- Check team members array
- Verify invitation was accepted
- Request re-invitation if needed

---

### "Only team owner can invite/update/remove" (403)

**Causes:**
- User is member but not owner
- Team ownership transferred

**Fix:**
- Check team owner field
- Only owner can perform these actions
- Contact owner to perform action

---

### "Invitation expired" (400)

**Causes:**
- More than 48 hours since invitation sent
- Invitation already used

**Fix:**
- Request new invitation from team owner
- Check invitation createdAt timestamp
- Accept invitations promptly

---

## Conclusion

The Actory authorization system provides:

✅ **Multi-layered Security** - Route, role, and resource-level checks
✅ **Flexible Collaboration** - Team-based access with roles
✅ **Mixed Entity Support** - User and ProductionHouse entities
✅ **Secure Invitations** - Token-based, expiring invitations
✅ **Resource Isolation** - Multi-tenant with clear boundaries
✅ **Comprehensive Auditing** - Notifications for all actions

This system ensures secure, scalable, multi-user collaboration while maintaining strict access controls! 🔐
