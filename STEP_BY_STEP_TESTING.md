# Step-by-Step Testing Guide - Complete Implementation

## ✅ Code Verification Status

All code changes have been verified to be in place:

### Backend Models ✅
- [x] `FilmProject.js` - RoleSchema with all fields (roleName, roleType, ageMin, ageMax, gender, physicalTraits, skillsRequired, experienceLevel, roleDescription, numberOfOpenings, castingCallId)
- [x] `CastingCall.js` - Added fields: project (ObjectId ref), projectRole (ObjectId), team (ObjectId ref)

### Backend Controllers ✅
- [x] `projects.js` - Methods present: createProject, updateProject, addRole, createCastingFromRole, getProjects, getProjectById
- [x] `casting.js` - Method present: getTeamCastingCalls (available at GET /api/v1/casting/team/:teamId)

### Backend Routes ✅
- [x] `routes/projects.js` - All endpoints configured:
  - `POST /` - createProject
  - `GET /` - getProjects
  - `GET /:id` - getProjectById
  - `PUT /:id` - updateProject
  - `POST /:id/roles` - addRole
  - `POST /:id/roles/:roleId/casting` - createCastingFromRole

- [x] `routes/casting.js` - Team casting endpoint configured:
  - `GET /team/:teamId` - getTeamCastingCalls

### Frontend Components ✅
- [x] `ProjectDetails.jsx` (452 lines) - Complete component for managing project roles and castings
- [x] `CastingList.jsx` - Enhanced with team castings filter and project information display

---

## 🧪 Testing Phase 1: Database Verification

### Step 1.1 - Check Database Connection
```bash
# Connect to your MongoDB instance
# Verify collections exist:
# - films (FilmProject documents)
# - castings (CastingCall documents)
# - productionteams (ProductionTeam documents)
```

**Expected Result**: All collections are present and have indexes

### Step 1.2 - Verify FilmProject Schema
```javascript
db.films.findOne({})
// Check for: team, name, genre, language, location, description, createdBy, collaborators, roles[], status, timestamps
```

**Expected Result**: Document includes roles array field

### Step 1.3 - Verify CastingCall Schema
```javascript
db.castings.findOne({})
// Check for: roleTitle, description, ageRange, genderRequirement, experienceLevel, producer, 
// NEW: project, projectRole, team
```

**Expected Result**: Document includes project, projectRole, and team fields

---

## 🧪 Testing Phase 2: Backend API Testing

### Step 2.1 - Create a Test Production Team
**Request**:
```http
POST /api/v1/teams HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer YOUR_PRODUCER_TOKEN

{
  "name": "Test Film Studio",
  "description": "Testing team for role-based castings"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "team_id_123",
    "name": "Test Film Studio",
    "owner": "producer_id",
    "members": []
  }
}
```

### Step 2.2 - Create a Film Project with Roles
**Request**:
```http
POST /api/v1/projects HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer YOUR_PRODUCER_TOKEN

{
  "teamId": "team_id_123",
  "name": "Detective Mystery",
  "genre": "Crime Thriller",
  "language": "English",
  "location": "New York",
  "startDate": "2026-03-01",
  "endDate": "2026-05-31",
  "description": "A thrilling detective story with multiple characters",
  "roles": [
    {
      "roleName": "Detective James",
      "roleType": "Lead",
      "ageMin": 35,
      "ageMax": 55,
      "gender": "Male",
      "physicalTraits": "Tall, athletic build",
      "skillsRequired": ["Dialogue", "Action", "Emotional depth"],
      "experienceLevel": "Professional",
      "roleDescription": "The main protagonist, a seasoned detective",
      "numberOfOpenings": 1
    },
    {
      "roleName": "Detective's Partner",
      "roleType": "Supporting",
      "ageMin": 30,
      "ageMax": 50,
      "gender": "Female",
      "physicalTraits": "Any",
      "skillsRequired": ["Dialogue", "Chemistry with Lead"],
      "experienceLevel": "Intermediate",
      "roleDescription": "The partner detective",
      "numberOfOpenings": 1
    }
  ]
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "project_id_456",
    "team": "team_id_123",
    "name": "Detective Mystery",
    "roles": [
      {
        "roleName": "Detective James",
        "roleType": "Lead",
        "_id": "role_id_1"
        // ... all role fields
      },
      {
        "roleName": "Detective's Partner",
        // ... role fields
      }
    ],
    "status": "draft"
  }
}
```

**Verification**: 
- [ ] Project created successfully
- [ ] All roles stored in roles array
- [ ] Each role has unique _id
- [ ] Notification sent to team members

### Step 2.3 - Get Project Details with Roles
**Request**:
```http
GET /api/v1/projects/project_id_456 HTTP/1.1
Authorization: Bearer YOUR_TEAM_MEMBER_TOKEN
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "project_id_456",
    "name": "Detective Mystery",
    "roles": [
      {
        "_id": "role_id_1",
        "roleName": "Detective James",
        "roleType": "Lead",
        "ageMin": 35,
        "ageMax": 55,
        "gender": "Male",
        "skillsRequired": ["Dialogue", "Action", "Emotional depth"],
        "experienceLevel": "Professional",
        "numberOfOpenings": 1
      }
    ]
  }
}
```

### Step 2.4 - Add New Role to Existing Project
**Request**:
```http
POST /api/v1/projects/project_id_456/roles HTTP/1.1
Authorization: Bearer YOUR_TEAM_MEMBER_TOKEN
Content-Type: application/json

{
  "role": {
    "roleName": "Crime Scene Investigator",
    "roleType": "Supporting",
    "ageMin": 25,
    "ageMax": 40,
    "gender": "Any",
    "skillsRequired": ["Attention to detail", "Science knowledge"],
    "experienceLevel": "Beginner",
    "roleDescription": "Forensic expert at crime scene",
    "numberOfOpenings": 1
  }
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "project_id_456",
    "roles": [
      // ... previous roles
      {
        "_id": "role_id_3",
        "roleName": "Crime Scene Investigator",
        // ... role data
      }
    ]
  }
}
```

**Verification**:
- [ ] Role added to project
- [ ] Notification sent to team members about new role

### Step 2.5 - Create Casting from Project Role
**Request**:
```http
POST /api/v1/projects/project_id_456/roles/role_id_1/casting HTTP/1.1
Authorization: Bearer YOUR_TEAM_MEMBER_TOKEN
Content-Type: application/json

{
  "roleId": "role_id_1",
  "castingData": {
    "description": "Seeking experienced actor for lead detective role",
    "auditionDate": "2026-02-15",
    "submissionDeadline": "2026-02-01",
    "location": "New York Studio",
    "skills": ["Dialogue", "Action", "Emotional depth"]
  }
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "casting_id_789",
    "roleTitle": "Detective James",
    "description": "Seeking experienced actor for lead detective role",
    "ageRange": {
      "min": 35,
      "max": 55
    },
    "genderRequirement": "male",
    "experienceLevel": "professional",
    "location": "New York Studio",
    "numberOfOpenings": 1,
    "auditionDate": "2026-02-15T00:00:00.000Z",
    "submissionDeadline": "2026-02-01T00:00:00.000Z",
    "producer": "producer_id",
    "project": "project_id_456",
    "projectRole": "role_id_1",
    "team": "team_id_123"
  }
}
```

**Verification**:
- [ ] Casting created successfully
- [ ] Casting linked to project via project field
- [ ] Casting linked to role via projectRole field
- [ ] Casting linked to team via team field
- [ ] Role requirements inherited from project role
- [ ] Notification sent to team members

### Step 2.6 - Get Team-Specific Castings
**Request**:
```http
GET /api/v1/casting/team/team_id_123 HTTP/1.1
Authorization: Bearer YOUR_TEAM_MEMBER_TOKEN
```

**Expected Response** (200):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "casting_id_789",
      "roleTitle": "Detective James",
      "project": {
        "_id": "project_id_456",
        "name": "Detective Mystery"
      },
      "team": "team_id_123",
      "auditionDate": "2026-02-15T00:00:00.000Z",
      "submissionDeadline": "2026-02-01T00:00:00.000Z"
    }
  ]
}
```

**Verification**:
- [ ] Returns only castings for team's projects
- [ ] Only team members can access
- [ ] Non-team members get 403 Forbidden

### Step 2.7 - Verify Authorization
**Request** (with non-team-member token):
```http
GET /api/v1/casting/team/team_id_123 HTTP/1.1
Authorization: Bearer DIFFERENT_USER_TOKEN
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "Not authorized to view this team's castings"
}
```

**Verification**:
- [ ] Non-team members cannot access team castings
- [ ] Proper error message returned

---

## 🧪 Testing Phase 3: Frontend Component Testing

### Step 3.1 - Verify ProjectDetails Component Loads
1. Navigate to `/projects/project_id_456` in the frontend
2. You should see:
   - [ ] Project title: "Detective Mystery"
   - [ ] Project details (genre, language, location, dates)
   - [ ] List of all roles in the project
   - [ ] "Add Role" button
   - [ ] "Create Casting" option for each role

### Step 3.2 - Test Add Role from Frontend
1. Click "Add Role" button in ProjectDetails
2. Fill in role form:
   - Role Name: "Witness"
   - Role Type: "Guest"
   - Age Range: 18-65
   - Gender: Any
   - Experience Level: Beginner
   - Skills: ["Dialogue"]
3. Click "Save Role"

**Expected Result**:
- [ ] Role added to project
- [ ] Form clears
- [ ] New role appears in list
- [ ] Success notification shows

### Step 3.3 - Test Create Casting from Role
1. Click "Create Casting" for "Detective James" role
2. Fill in casting form:
   - Description: "Experienced actor needed"
   - Audition Date: 2026-02-15
   - Submission Deadline: 2026-02-01
   - Location: New York
3. Click "Create Casting"

**Expected Result**:
- [ ] Casting created linked to project and role
- [ ] Casting appears in "Team Castings" list
- [ ] Success message shows
- [ ] Project role shows "casting linked"

### Step 3.4 - Test CastingList Team Filter
1. Navigate to `/castings`
2. If logged in as team member, you should see "My Team Castings" button
3. Click "My Team Castings"

**Expected Result**:
- [ ] Button highlights/changes appearance
- [ ] List shows only team's castings
- [ ] Castings show project information
- [ ] "View Project" link available on each casting card

### Step 3.5 - Test Casting Card Enhancement
1. Look at each casting card on CastingList
2. If casting has a linked project, you should see:
   - [ ] "Project: [Project Name]" text
   - [ ] All standard casting information
   - [ ] Project link/button (if available)

### Step 3.6 - Test Navigation from Casting to Project
1. From CastingList, click on a project-linked casting
2. This should take you to `/casting/casting_id` (CastingDetails)
3. From CastingDetails, there should be a link to the project
4. Clicking project link should take you to ProjectDetails

**Expected Result**:
- [ ] Can navigate from casting to project details
- [ ] Project shows all roles and castings
- [ ] Can view other castings for same project

---

## 🧪 Testing Phase 4: Notification System Testing

### Step 4.1 - Verify Project Creation Notification
1. Log in as Producer/Team Owner
2. Create new project with roles
3. Check notifications for team members (use separate account)

**Expected Result**:
- [ ] Team members receive notification: "New project created: [Project Name]"
- [ ] Notification type: "project"
- [ ] Notification links to project

### Step 4.2 - Verify Role Addition Notification
1. Add a new role to existing project
2. Check notifications for team members

**Expected Result**:
- [ ] Team members receive notification: "New role added: [Role Name]"
- [ ] Notification shows project name
- [ ] Notification type: "role"

### Step 4.3 - Verify Casting Creation Notification
1. Create casting from project role
2. Check notifications for team members

**Expected Result**:
- [ ] Team members receive notification: "New casting call posted: [Role Name]"
- [ ] Notification shows project name
- [ ] Notification type: "casting"

---

## 🧪 Testing Phase 5: Data Integrity Testing

### Step 5.1 - Verify Role ID Consistency
```javascript
// In MongoDB console
db.films.findOne({ _id: ObjectId("project_id_456") }).roles[0]
// Check: has unique _id for each role
```

**Expected Result**:
- [ ] Each role has unique _id
- [ ] castingCallId field can reference CastingCall

### Step 5.2 - Verify Casting-Project-Role Linking
```javascript
// Get a casting
const casting = db.castings.findOne({ _id: ObjectId("casting_id_789") })

// Verify fields
casting.project // Should be ObjectId of project
casting.projectRole // Should be ObjectId (role's _id)
casting.team // Should be ObjectId of team

// Verify we can populate
const project = db.films.findOne({ _id: casting.project })
// Should have roles array with matching role
```

**Expected Result**:
- [ ] casting.project links to FilmProject
- [ ] casting.projectRole points to role in project.roles
- [ ] casting.team links to ProductionTeam
- [ ] All relationships resolve correctly

### Step 5.3 - Verify Circular References Don't Exist
```javascript
// Role references casting
const role = db.films.findOne({ _id: ObjectId("project_id_456") }).roles[0]
role.castingCallId // Should be ObjectId of CastingCall

// Verify no duplicate data
const casting = db.castings.findOne({ _id: role.castingCallId })
// Casting should reference project, not duplicate project data
```

**Expected Result**:
- [ ] Only IDs stored, not full documents
- [ ] No data duplication
- [ ] References can be resolved via populate

---

## 🧪 Testing Phase 6: Permission & Authorization Testing

### Step 6.1 - Non-Team Member Cannot Create Project for Team
```http
POST /api/v1/projects HTTP/1.1
Authorization: Bearer NON_MEMBER_TOKEN

{
  "teamId": "team_id_123",
  "name": "Unauthorized Project"
}
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "Not authorized for this team"
}
```

### Step 6.2 - Non-Team Member Cannot Add Role
```http
POST /api/v1/projects/project_id_456/roles HTTP/1.1
Authorization: Bearer NON_MEMBER_TOKEN

{
  "role": { ... }
}
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "Not authorized for this project"
}
```

### Step 6.3 - Non-Team Member Cannot Create Casting from Role
```http
POST /api/v1/projects/project_id_456/roles/role_id_1/casting HTTP/1.1
Authorization: Bearer NON_MEMBER_TOKEN
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "Not authorized for this project"
}
```

### Step 6.4 - Non-Team Member Cannot View Team Castings
```http
GET /api/v1/casting/team/team_id_123 HTTP/1.1
Authorization: Bearer NON_MEMBER_TOKEN
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "Not authorized to view this team's castings"
}
```

### Step 6.5 - Public Can Browse All Castings
```http
GET /api/v1/casting HTTP/1.1
# No Authorization header
```

**Expected Response** (200):
```json
{
  "success": true,
  "count": X,
  "data": [ /* all public castings */ ]
}
```

---

## 🧪 Testing Phase 7: Edge Cases & Error Handling

### Step 7.1 - Missing Required Fields
**Request**:
```http
POST /api/v1/projects HTTP/1.1

{
  "teamId": "team_id_123"
  // Missing "name"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "teamId and name are required"
}
```

### Step 7.2 - Invalid Team ID
**Request**:
```http
POST /api/v1/projects HTTP/1.1

{
  "teamId": "invalid_id",
  "name": "Test Project"
}
```

**Expected Response** (404):
```json
{
  "success": false,
  "message": "Team not found"
}
```

### Step 7.3 - Duplicate Role Names (Should be Allowed)
1. Create project with role "Detective"
2. Try to add another role "Detective" to same project
3. System should allow (useful for multiple casting for same role)

**Expected Result**:
- [ ] Multiple roles with same name allowed
- [ ] Each gets unique _id
- [ ] Each can link to different casting

### Step 7.4 - Update Project with New Roles
**Request**:
```http
PUT /api/v1/projects/project_id_456 HTTP/1.1

{
  "roles": [ /* new roles array */ ]
}
```

**Expected Result**:
- [ ] Roles updated completely
- [ ] Team members notified
- [ ] Old castings still link to project

---

## 🧪 Testing Phase 8: Performance & Load Testing

### Step 8.1 - Large Role List
1. Create project with 50 roles
2. Navigate to ProjectDetails
3. Check load time

**Expected Result**:
- [ ] Loads within 2 seconds
- [ ] All roles display correctly
- [ ] UI remains responsive

### Step 8.2 - Large Casting List for Team
1. Create 100 castings for same team
2. Call GET /api/v1/casting/team/team_id

**Expected Result**:
- [ ] Response within 500ms
- [ ] All castings included
- [ ] Proper pagination if needed

### Step 8.3 - Database Query Performance
```javascript
// Check indexes exist
db.castings.getIndexes()
// Should see indexes on: project, team, projectRole
```

**Expected Result**:
- [ ] Indexes exist on foreign keys
- [ ] Queries use indexes (check explain())

---

## ✅ Success Criteria Checklist

### Backend
- [ ] All models have correct schema with new fields
- [ ] All controllers have new methods working
- [ ] All routes are properly configured
- [ ] Notifications send to team members
- [ ] Authorization checks work correctly
- [ ] Circular references don't exist
- [ ] Database indexes are created

### Frontend
- [ ] ProjectDetails component loads and displays
- [ ] Can add roles to project
- [ ] Can create casting from role
- [ ] Can view team castings
- [ ] CastingList shows project info
- [ ] Team filter works correctly
- [ ] Navigation between pages works

### Data Integrity
- [ ] Roles linked correctly in project
- [ ] Castings linked to project and role
- [ ] Team information consistent
- [ ] No duplicate data
- [ ] References resolve correctly

### Security
- [ ] Non-members cannot access team data
- [ ] Only team members can create roles/castings
- [ ] Public can view castings
- [ ] Proper error messages (no sensitive data)
- [ ] Authorization on all protected routes

### User Experience
- [ ] Notifications arrive promptly
- [ ] UI updates reflect changes
- [ ] Forms validate properly
- [ ] Error messages are clear
- [ ] Navigation is intuitive

---

## 📋 Testing Execution Checklist

Copy and use this during testing:

```
PHASE 1: DATABASE ✓
- [ ] Collections exist
- [ ] FilmProject schema verified
- [ ] CastingCall schema verified

PHASE 2: BACKEND API ✓
- [ ] Create team
- [ ] Create project with roles
- [ ] Get project details
- [ ] Add role to project
- [ ] Create casting from role
- [ ] Get team castings
- [ ] Verify authorization

PHASE 3: FRONTEND ✓
- [ ] ProjectDetails loads
- [ ] Add role works
- [ ] Create casting works
- [ ] CastingList filter works
- [ ] Project info on cards
- [ ] Navigation works

PHASE 4: NOTIFICATIONS ✓
- [ ] Project creation notification
- [ ] Role addition notification
- [ ] Casting creation notification

PHASE 5: DATA INTEGRITY ✓
- [ ] Role IDs unique
- [ ] Casting relationships correct
- [ ] No circular references
- [ ] Data not duplicated

PHASE 6: PERMISSIONS ✓
- [ ] Non-member blocked
- [ ] Team member allowed
- [ ] Public can view castings

PHASE 7: ERROR HANDLING ✓
- [ ] Missing fields caught
- [ ] Invalid IDs handled
- [ ] Edge cases work

PHASE 8: PERFORMANCE ✓
- [ ] Large lists load fast
- [ ] Queries performant
- [ ] Indexes working
```

---

## 🔍 Debugging Tips

### If Backend Tests Fail
1. Check server logs: `npm start`
2. Verify MongoDB connection
3. Check middleware (auth, body parser)
4. Use Postman/Thunder Client to debug
5. Check database directly with mongo shell

### If Frontend Tests Fail
1. Check browser console for errors
2. Open DevTools Network tab
3. Verify API endpoints being called
4. Check localStorage for user/token
5. Clear browser cache if needed

### If Notifications Don't Work
1. Verify notificationService.js is imported
2. Check Socket.io connection
3. Verify user IDs in notifications
4. Check MongoDB Notification collection
5. Monitor logs for errors

### If Data Relationships Fail
1. Check ObjectId format is correct
2. Verify populate() calls in controllers
3. Check schema ref strings match model names
4. Use MongoDB explain() for query analysis
5. Verify indexes created

---

## 📞 Quick Debug Queries

```javascript
// Count projects with roles
db.films.countDocuments({ roles: { $exists: true, $ne: [] } })

// Count castings linked to projects
db.castings.countDocuments({ project: { $exists: true } })

// List all team castings
db.castings.find({ team: ObjectId("team_id") }).pretty()

// Find castings without projects
db.castings.find({ project: { $exists: false } })

// Verify role-casting linking
db.films.aggregate([
  { $unwind: "$roles" },
  { $match: { "roles.castingCallId": { $exists: true } } }
])
```

---

**Testing Status**: Ready to Execute
**Last Updated**: January 22, 2026

