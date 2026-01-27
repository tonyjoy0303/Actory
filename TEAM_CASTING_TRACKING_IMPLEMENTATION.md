# Team Casting Tracking - Implementation Summary

**Date**: January 27, 2026  
**Feature**: All team members can now track all casting submissions from their teams

---

## 🎯 What Changed

### Summary
All production team members can now see and track ALL casting calls and submissions from projects in their teams directly from their dashboard, not just castings they personally created.

---

## 📋 Implementation Details

### 1. Enhanced Producer Dashboard Endpoint

**Endpoint**: `GET /api/v1/casting/producer`  
**Access**: Private (Producer, ProductionTeam)

#### What It Returns Now
```javascript
// Previously: Only castings created by the logged-in user
// Now: Castings created by user + ALL castings from teams they're part of

{
  "success": true,
  "count": 15,  // All castings user has access to
  "data": [
    {
      "_id": "casting123",
      "roleTitle": "Lead Actor",
      "producer": { "name": "John Doe", ... },
      "project": { "name": "My Film", ... },
      "team": { "_id": "team123", "name": "Production Team Alpha" },
      "status": "Pending",
      "submissionDeadline": "2026-02-10T00:00:00.000Z",
      // ... all other casting details
    },
    // ... more castings from user's teams
  ]
}
```

#### How It Works
```javascript
exports.getProducerCastingCalls = async (req, res, next) => {
  try {
    // 1. Find all teams where user is owner OR member
    const teams = await ProductionTeam.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).select('_id');
    
    const teamIds = teams.map(team => team._id);
    
    // 2. Find casting calls where:
    //    - User is the producer (their own castings), OR
    //    - Casting belongs to any team the user is part of
    const query = {
      $or: [
        { producer: req.user._id },
        { team: { $in: teamIds } }
      ]
    };
    
    // 3. Return all matching castings
    const castingCalls = await CastingCall.find(query)
      .populate('producer', 'name email')
      .populate('project', 'name description')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ 
      success: true, 
      count: castingCalls.length, 
      data: castingCalls 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + err.message 
    });
  }
};
```

---

### 2. Enhanced Casting Creation

**Endpoint**: `POST /api/v1/casting`  
**Access**: Private (Producer, ProductionTeam)

#### What Changed
Casting creation now properly stores `project`, `team`, and `projectRole` references:

```javascript
const castingCall = await CastingCall.create({
  roleTitle,
  description,
  // ... other fields
  producer: req.user._id,
  // NEW: Properly store team and project associations
  project: req.body.project || req.body.projectId,
  team: req.body.team || req.body.teamId,
  projectRole: req.body.projectRole || req.body.roleId
});
```

This ensures all castings are linked to their teams, making them visible to all team members.

---

### 3. Automatic Casting Creation During Project/Role Creation

#### During Project Creation
When a project is created with roles, castings are automatically created with team association:

```javascript
// In createProject function
const casting = await CastingCall.create({
  roleTitle: role.roleName,
  description: role.roleDescription || `Looking for ${role.roleType}...`,
  // ... other fields
  producer: req.user._id,
  project: project._id,
  projectRole: project.roles[idx]?._id,
  team: team._id  // ✅ Team association added
});
```

#### When Adding a New Role to Existing Project
When a role is added via `addRole`, a casting is auto-created with team:

```javascript
// In addRole function
const castingCall = await CastingCall.create({
  roleTitle: addedRole.roleName,
  description: addedRole.roleDescription || `Casting for ${addedRole.roleName}`,
  // ... other fields
  producer: req.user._id,
  project: project._id,
  projectRole: addedRole._id,
  team: team._id  // ✅ Team association added
});
```

---

## 🔐 Authorization & Access Control

### Who Can See What

#### Team Members
- **Owner**: Can see ALL castings from ALL their teams
- **Recruiter/Manager**: Can see ALL castings from teams they're part of
- **Viewer**: Can see ALL castings from teams they're part of (read-only for submissions)

#### Viewing Submissions
Team members can view submissions through:
```
GET /api/v1/casting/:castingCallId/videos
```

**Authorization Logic**:
```javascript
// Producer always authorized
if (castingCall.producer.toString() === userId) return true;

// Team members authorized for their team's castings
const team = await ProductionTeam.findById(castingCall.team);
const isOwner = team.owner.toString() === userId;
const isMember = team.members.some(m => m.user.toString() === userId);

return isOwner || isMember;  // ✅ Any team member can view
```

#### Updating Submission Status
Team members can update submission status (Accept/Reject):
```
PATCH /api/v1/videos/:videoId/status
```

**Authorization Logic**:
```javascript
// Producer always authorized
if (castingCall.producer.toString() === userId) return true;

// For team members:
const team = await ProductionTeam.findById(castingCall.team);
const isOwner = team.owner.toString() === userId;
const member = team.members.find(m => m.user.toString() === userId);

// Owner OR non-Viewer members can update
return isOwner || (member && member.role !== 'Viewer');
```

---

## 📊 Dashboard User Experience

### For Team Members

#### Active Castings Section
When a team member accesses their dashboard and calls:
```
GET /api/v1/casting/producer
```

**They will see**:
1. ✅ All castings they personally created
2. ✅ All castings from projects in Team A (where they're a member)
3. ✅ All castings from projects in Team B (where they're a member)
4. ✅ All castings from projects in any team they belong to

**Example Response**:
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "_id": "casting1",
      "roleTitle": "Lead Actor",
      "producer": { "_id": "user1", "name": "John (Creator)" },
      "team": { "_id": "teamA", "name": "Production Team Alpha" },
      "project": { "_id": "proj1", "name": "My Film" },
      "submissionDeadline": "2026-02-10T00:00:00.000Z"
    },
    {
      "_id": "casting2",
      "roleTitle": "Supporting Actress",
      "producer": { "_id": "user2", "name": "Jane (Creator)" },
      "team": { "_id": "teamA", "name": "Production Team Alpha" },
      "project": { "_id": "proj2", "name": "Another Film" },
      "submissionDeadline": "2026-02-15T00:00:00.000Z"
    },
    {
      "_id": "casting3",
      "roleTitle": "Villain",
      "producer": { "_id": "currentUser", "name": "You" },
      "team": { "_id": "teamB", "name": "Production Team Beta" },
      "project": { "_id": "proj3", "name": "Your Film" },
      "submissionDeadline": "2026-02-20T00:00:00.000Z"
    }
    // ... more castings from all teams
  ]
}
```

#### Tracking Submissions
For each casting call, team members can:

1. **View All Submissions**:
   ```
   GET /api/v1/casting/:castingCallId/videos
   ```

2. **See Submission Details**:
   - Actor information
   - Video quality assessment
   - Contact details
   - Portfolio
   - Submission status

3. **Update Status** (if authorized):
   ```
   PATCH /api/v1/videos/:videoId/status
   Body: { "status": "Accepted" }
   ```

---

## 🎬 Complete Workflow Example

### Scenario: Production Team Creating a Film Project

#### Step 1: Team Owner Creates Project with Roles
```javascript
POST /api/v1/projects
{
  "teamId": "team123",
  "name": "Epic Adventure Film",
  "roles": [
    {
      "roleName": "Hero",
      "roleType": "Lead",
      "gender": "Male",
      "ageMin": 25,
      "ageMax": 35
    },
    {
      "roleName": "Mentor",
      "roleType": "Supporting",
      "gender": "Any",
      "ageMin": 50,
      "ageMax": 70
    }
  ]
}
```

**What Happens**:
1. Project created ✅
2. Two casting calls auto-created ✅
3. Both castings linked to `team123` ✅
4. All team members notified ✅

#### Step 2: Team Members Access Dashboard
**Team Member A (Recruiter) calls**:
```
GET /api/v1/casting/producer
```

**Receives**:
- Casting for "Hero" role
- Casting for "Mentor" role
- All other castings from `team123` projects
- Any castings they personally created

#### Step 3: Actors Submit Auditions
Actors discover and apply to the castings:
```
POST /api/v1/casting/:castingCallId/videos
```

#### Step 4: Team Members Review Submissions
**Any team member can view**:
```
GET /api/v1/casting/casting123/videos
```

**Response**:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "video1",
      "actor": {
        "_id": "actor1",
        "name": "Raj Kumar",
        "email": "raj@example.com"
      },
      "status": "Pending",
      "qualityAssessment": { "level": "High", "score": 8.5 },
      "height": 180,
      "age": 28
      // ... more actor details
    }
    // ... 24 more submissions
  ]
}
```

#### Step 5: Team Makes Decisions
**Recruiter updates status**:
```
PATCH /api/v1/videos/video1/status
Body: { "status": "Accepted" }
```

**Viewer tries to update** (gets error):
```
PATCH /api/v1/videos/video1/status
Response: { 
  "success": false, 
  "message": "Not authorized to update this submission" 
}
```

---

## 🔄 Data Flow Diagram

```
User Dashboard
    ↓
GET /api/v1/casting/producer
    ↓
Backend finds:
  1. Teams where user is member/owner
  2. All castings from those teams
  3. All castings created by user
    ↓
Returns combined list
    ↓
User sees ALL active castings
    ↓
User clicks on a casting
    ↓
GET /api/v1/casting/:castingCallId/videos
    ↓
Backend checks:
  - Is user the producer? ✅
  - Is user a team member? ✅
    ↓
Returns all submissions
    ↓
User reviews and updates status
    ↓
PATCH /api/v1/videos/:videoId/status
    ↓
Backend checks:
  - Is user producer? ✅
  - Is user owner/non-viewer member? ✅
    ↓
Status updated ✅
```

---

## ✅ Benefits

### For Production Teams
1. **Centralized Tracking**: All team members see all team castings in one place
2. **Collaborative Review**: Multiple team members can review submissions
3. **Role-Based Access**: Different permissions for different roles
4. **Real-Time Updates**: Everyone sees the latest submission statuses

### For Recruiters
1. **Complete Visibility**: See ALL casting calls from ALL their teams
2. **Easy Management**: Single dashboard for all active castings
3. **Team Collaboration**: Work together with team members on casting decisions
4. **Submission Tracking**: Monitor all submissions across all team projects

### For Actors
1. **Transparent Process**: Clear submission tracking
2. **Status Updates**: Know when decisions are made
3. **Quality Feedback**: See quality assessment scores

---

## 🚀 Testing the Feature

### Test Case 1: Team Member Views Dashboard
```javascript
// User is member of Team A and Team B
GET /api/v1/casting/producer
Authorization: Bearer <team_member_token>

// Should return:
// - All castings from Team A projects
// - All castings from Team B projects
// - Any castings user personally created
```

### Test Case 2: Team Member Views Submissions
```javascript
// Casting belongs to Team A, user is Team A member
GET /api/v1/casting/casting123/videos
Authorization: Bearer <team_member_token>

// Should return:
// - All submissions for this casting
// - Actor details
// - Quality assessments
```

### Test Case 3: Recruiter Updates Status
```javascript
// User is Recruiter in Team A
PATCH /api/v1/videos/video123/status
Authorization: Bearer <recruiter_token>
Body: { "status": "Accepted" }

// Should succeed ✅
```

### Test Case 4: Viewer Tries to Update Status
```javascript
// User is Viewer in Team A
PATCH /api/v1/videos/video123/status
Authorization: Bearer <viewer_token>
Body: { "status": "Accepted" }

// Should fail with 401 ❌
```

---

## 📝 Summary of Changes

### Files Modified
1. **[controllers/casting.js](actory-spotlight-backend/controllers/casting.js)**
   - Enhanced `getProducerCastingCalls` to include team castings
   - Enhanced `createCastingCall` to store team/project associations

### No Changes Needed (Already Working)
1. **[controllers/projects.js](actory-spotlight-backend/controllers/projects.js)**
   - Already creates castings with team association
   - Both `createProject` and `addRole` functions working correctly

2. **[routes/casting.js](actory-spotlight-backend/routes/casting.js)**
   - Already allows 'ProductionTeam' role for producer endpoints

3. **Authorization Logic**
   - Already supports team member access to submissions
   - Already enforces role-based permissions for updates

---

## 🎯 Key Takeaways

1. ✅ **All team members** can now see **all castings** from their teams
2. ✅ **Single dashboard endpoint** (`/casting/producer`) shows everything
3. ✅ **Team-based authorization** works automatically
4. ✅ **Role-based permissions** control who can update statuses
5. ✅ **Automatic casting creation** ensures all roles have castings
6. ✅ **Complete submission tracking** for all team members

---

**Implementation Complete**: January 27, 2026  
**Status**: ✅ Fully Functional
