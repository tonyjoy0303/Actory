# Project Creation & Team Collaboration - Code & API Reference

## Table of Contents
1. [Team APIs](#team-apis)
2. [Project APIs](#project-apis)
3. [Casting APIs](#casting-apis)
4. [Invitation APIs](#invitation-apis)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)
7. [Database Queries](#database-queries)

---

## Team APIs

### 1. Create Team

**Endpoint**: `POST /api/v1/teams`

**Authentication**: Required (Producer/ProductionTeam role)

**Request Body**:
```javascript
{
  name: String,                    // Required, max 120 chars
  productionHouse: String,         // Optional, max 120 chars
  description: String              // Optional, max 500 chars
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/v1/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Summer Projects Team",
    "productionHouse": "XYZ Productions",
    "description": "Our team for summer productions 2024"
  }'
```

**Success Response** (201 Created):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    name: "Summer Projects Team",
    productionHouse: "XYZ Productions",
    description: "Our team for summer productions 2024",
    owner: "507f1f77bcf86cd799439012",
    members: [
      {
        user: "507f1f77bcf86cd799439012",
        role: "Owner",
        addedAt: "2024-01-22T10:00:00.000Z"
      }
    ],
    createdAt: "2024-01-22T10:00:00.000Z",
    updatedAt: "2024-01-22T10:00:00.000Z",
    __v: 0
  }
}
```

**Error Responses**:
```javascript
// Missing required field
{
  success: false,
  message: "Team name is required"
}

// Unauthorized (not Producer role)
{
  success: false,
  message: "Not authorized to perform this action"
}

// Server error
{
  success: false,
  message: "Failed to create team"
}
```

---

### 2. Get My Teams

**Endpoint**: `GET /api/v1/teams`

**Authentication**: Required

**Query Parameters**: None

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439011",
      name: "Summer Projects Team",
      productionHouse: "XYZ Productions",
      owner: "507f1f77bcf86cd799439012",
      members: [
        {
          user: "507f1f77bcf86cd799439012",
          role: "Owner"
        },
        {
          user: "507f1f77bcf86cd799439013",
          role: "Recruiter"
        }
      ],
      createdAt: "2024-01-22T10:00:00.000Z",
      updatedAt: "2024-01-22T10:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439014",
      name: "Winter Drama Team",
      // ...
    }
  ]
}
```

---

### 3. Get Team Details

**Endpoint**: `GET /api/v1/teams/:teamId`

**Authentication**: Required + User must be team member

**URL Parameters**:
- `teamId`: Team's MongoDB ObjectId

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/teams/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    name: "Summer Projects Team",
    productionHouse: "XYZ Productions",
    description: "Our team for summer productions 2024",
    owner: {
      _id: "507f1f77bcf86cd799439012",
      name: "John Producer",
      email: "john@example.com",
      role: "Producer",
      profileImage: "https://..."
    },
    members: [
      {
        user: {
          _id: "507f1f77bcf86cd799439012",
          name: "John Producer",
          email: "john@example.com",
          role: "Producer",
          profileImage: "https://..."
        },
        role: "Owner",
        addedAt: "2024-01-22T10:00:00.000Z"
      },
      {
        user: {
          _id: "507f1f77bcf86cd799439013",
          name: "Jane Recruiter",
          email: "jane@example.com",
          role: "Producer",
          profileImage: "https://..."
        },
        role: "Recruiter",
        addedAt: "2024-01-22T11:00:00.000Z"
      }
    ],
    createdAt: "2024-01-22T10:00:00.000Z",
    updatedAt: "2024-01-22T10:00:00.000Z"
  }
}
```

---

### 4. Update Team

**Endpoint**: `PUT /api/v1/teams/:teamId`

**Authentication**: Required + User must be team owner

**Request Body**:
```javascript
{
  name: String,                    // Optional
  productionHouse: String,         // Optional
  description: String              // Optional
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:5000/api/v1/teams/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "description": "Updated team description for 2024"
  }'
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    name: "Summer Projects Team",
    productionHouse: "XYZ Productions",
    description: "Updated team description for 2024",
    // ... rest of team data
  }
}
```

---

### 5. Remove Team Member

**Endpoint**: `DELETE /api/v1/teams/:teamId/members/:memberId`

**Authentication**: Required + User must be team owner

**URL Parameters**:
- `teamId`: Team's ObjectId
- `memberId`: Member to remove (User's ObjectId)

**Example Request**:
```bash
curl -X DELETE http://localhost:5000/api/v1/teams/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  message: "Member removed from team"
}
```

**Error Response**:
```javascript
{
  success: false,
  message: "Only owner can remove members"
}
```

---

### 6. Leave Team

**Endpoint**: `POST /api/v1/teams/:teamId/leave`

**Authentication**: Required + User must be team member

**Request Body**: Empty or no body needed

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/v1/teams/507f1f77bcf86cd799439011/leave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  message: "You have left the team"
}
```

---

### 7. Delete Team

**Endpoint**: `DELETE /api/v1/teams/:teamId`

**Authentication**: Required + User must be team owner

**Example Request**:
```bash
curl -X DELETE http://localhost:5000/api/v1/teams/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  message: "Team deleted successfully"
}
```

---

## Project APIs

### 1. Create Project

**Endpoint**: `POST /api/v1/projects`

**Authentication**: Required + User must be team member with Owner or Recruiter role

**Request Body**:
```javascript
{
  teamId: String,                              // Required, team's ObjectId
  name: String,                                // Required, max 150 chars
  genre: String,                               // Optional, max 60 chars
  language: String,                            // Optional, max 60 chars
  location: String,                            // Optional, max 120 chars
  startDate: Date,                             // Optional, ISO 8601 format
  endDate: Date,                               // Optional, ISO 8601 format
  description: String,                         // Optional, max 800 chars
  roles: [                                     // Optional array of role objects
    {
      roleName: String,                        // Required
      roleType: Enum['Lead', 'Supporting', 'Guest', 'Extra'],
      ageMin: Number,                          // 1-120
      ageMax: Number,                          // 1-120
      gender: Enum['Male', 'Female', 'Any'],
      physicalTraits: String,
      skillsRequired: [String],
      experienceLevel: Enum['Beginner', 'Intermediate', 'Professional'],
      roleDescription: String,
      numberOfOpenings: Number
    }
  ]
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamId": "507f1f77bcf86cd799439011",
    "name": "Monsoon Action Drama",
    "genre": "Action/Drama",
    "language": "English",
    "location": "Goa",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-15T00:00:00Z",
    "description": "An action-packed drama set during monsoon season",
    "roles": [
      {
        "roleName": "Lead Hero",
        "roleType": "Lead",
        "ageMin": 28,
        "ageMax": 38,
        "gender": "Male",
        "physicalTraits": "Athletic build, 6ft+",
        "skillsRequired": ["Acting", "Martial Arts", "Horse Riding"],
        "experienceLevel": "Professional",
        "roleDescription": "The protagonist of our story",
        "numberOfOpenings": 1
      },
      {
        "roleName": "Lead Heroine",
        "roleType": "Lead",
        "ageMin": 25,
        "ageMax": 35,
        "gender": "Female",
        "skillsRequired": ["Acting"],
        "experienceLevel": "Intermediate",
        "roleDescription": "Female lead character",
        "numberOfOpenings": 1
      }
    ]
  }'
```

**Success Response** (201 Created):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439020",
    team: "507f1f77bcf86cd799439011",
    name: "Monsoon Action Drama",
    genre: "Action/Drama",
    language: "English",
    location: "Goa",
    startDate: "2024-06-01T00:00:00.000Z",
    endDate: "2024-08-15T00:00:00.000Z",
    description: "An action-packed drama set during monsoon season",
    createdBy: "507f1f77bcf86cd799439012",
    collaborators: ["507f1f77bcf86cd799439012"],
    roles: [
      {
        _id: "507f1f77bcf86cd799439021",
        roleName: "Lead Hero",
        roleType: "Lead",
        ageMin: 28,
        ageMax: 38,
        gender: "Male",
        physicalTraits: "Athletic build, 6ft+",
        skillsRequired: ["Acting", "Martial Arts", "Horse Riding"],
        experienceLevel: "Professional",
        roleDescription: "The protagonist of our story",
        numberOfOpenings: 1
      },
      {
        _id: "507f1f77bcf86cd799439022",
        roleName: "Lead Heroine",
        roleType: "Lead",
        ageMin: 25,
        ageMax: 35,
        gender: "Female",
        skillsRequired: ["Acting"],
        experienceLevel: "Intermediate",
        roleDescription: "Female lead character",
        numberOfOpenings: 1
      }
    ],
    status: "draft",
    createdAt: "2024-01-22T10:00:00.000Z",
    updatedAt: "2024-01-22T10:00:00.000Z"
  }
}
```

**Background Process** (Non-blocking):
- CastingCall documents automatically created for each role
- Team members notified about new project
- Process happens asynchronously after response sent

---

### 2. Get My Projects

**Endpoint**: `GET /api/v1/projects`

**Authentication**: Required

**Query Parameters**: None

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439020",
      team: "507f1f77bcf86cd799439011",
      name: "Monsoon Action Drama",
      genre: "Action/Drama",
      language: "English",
      location: "Goa",
      status: "draft",
      // ... more project data
    }
    // ... more projects
  ]
}
```

---

### 3. Get Project Details

**Endpoint**: `GET /api/v1/projects/:projectId`

**Authentication**: Optional (public readable)

**URL Parameters**:
- `projectId`: Project's ObjectId

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/projects/507f1f77bcf86cd799439020
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439020",
    team: {
      _id: "507f1f77bcf86cd799439011",
      name: "Summer Projects Team",
      // ... team data
    },
    name: "Monsoon Action Drama",
    genre: "Action/Drama",
    language: "English",
    location: "Goa",
    startDate: "2024-06-01T00:00:00.000Z",
    endDate: "2024-08-15T00:00:00.000Z",
    description: "An action-packed drama set during monsoon season",
    createdBy: {
      _id: "507f1f77bcf86cd799439012",
      name: "John Producer",
      email: "john@example.com"
    },
    collaborators: [
      {
        _id: "507f1f77bcf86cd799439012",
        name: "John Producer"
      }
    ],
    roles: [
      {
        _id: "507f1f77bcf86cd799439021",
        roleName: "Lead Hero",
        // ... role details
      }
    ],
    status: "draft",
    createdAt: "2024-01-22T10:00:00.000Z"
  }
}
```

---

### 4. Update Project

**Endpoint**: `PUT /api/v1/projects/:projectId`

**Authentication**: Required + User must be team member

**Request Body**:
```javascript
{
  name: String,              // Optional
  genre: String,             // Optional
  language: String,          // Optional
  location: String,          // Optional
  startDate: Date,           // Optional
  endDate: Date,             // Optional
  description: String        // Optional
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:5000/api/v1/projects/507f1f77bcf86cd799439020 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "location": "Goa and Mumbai",
    "endDate": "2024-09-01T00:00:00Z"
  }'
```

---

### 5. Add Role to Project

**Endpoint**: `POST /api/v1/projects/:projectId/roles`

**Authentication**: Required + User must be team member

**Request Body**:
```javascript
{
  role: {
    roleName: String,
    roleType: Enum['Lead', 'Supporting', 'Guest', 'Extra'],
    ageMin: Number,
    ageMax: Number,
    gender: Enum['Male', 'Female', 'Any'],
    physicalTraits: String,
    skillsRequired: [String],
    experienceLevel: Enum['Beginner', 'Intermediate', 'Professional'],
    roleDescription: String,
    numberOfOpenings: Number
  }
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/v1/projects/507f1f77bcf86cd799439020/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "role": {
      "roleName": "Villain",
      "roleType": "Supporting",
      "ageMin": 35,
      "ageMax": 50,
      "gender": "Male",
      "physicalTraits": "Intense, commanding",
      "skillsRequired": ["Acting", "Combat"],
      "experienceLevel": "Professional",
      "roleDescription": "The antagonist",
      "numberOfOpenings": 1
    }
  }'
```

**Success Response**:
```javascript
{
  success: true,
  data: {
    // Updated project with new role added
  }
}
```

---

### 6. Delete Project

**Endpoint**: `DELETE /api/v1/projects/:projectId`

**Authentication**: Required + User must be project creator or team owner

**Example Request**:
```bash
curl -X DELETE http://localhost:5000/api/v1/projects/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response**:
```javascript
{
  success: true,
  message: "Project deleted"
}
```

---

## Invitation APIs

### 1. Send Team Invitation

**Endpoint**: `POST /api/v1/teamInvitations`

**Authentication**: Required + User must be team owner

**Request Body**:
```javascript
{
  teamId: String,                    // Required, team's ObjectId
  inviteeEmail: String,              // Required (if no inviteeId)
  inviteeId: String,                 // Required (if no inviteeEmail)
  role: Enum['Recruiter', 'Viewer'], // Required, default: 'Recruiter'
  projectId: String                  // Optional, specific project invite
}
```

**Example Request (by email)**:
```bash
curl -X POST http://localhost:5000/api/v1/teamInvitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamId": "507f1f77bcf86cd799439011",
    "inviteeEmail": "recruiter@example.com",
    "role": "Recruiter",
    "projectId": "507f1f77bcf86cd799439020"
  }'
```

**Example Request (by user ID)**:
```bash
curl -X POST http://localhost:5000/api/v1/teamInvitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teamId": "507f1f77bcf86cd799439011",
    "inviteeId": "507f1f77bcf86cd799439013",
    "role": "Recruiter"
  }'
```

**Success Response** (201 Created):
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439030",
    team: "507f1f77bcf86cd799439011",
    invitedBy: "507f1f77bcf86cd799439012",
    invitee: "507f1f77bcf86cd799439013",
    project: "507f1f77bcf86cd799439020",
    role: "Recruiter",
    status: "pending",
    token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    expiresAt: "2024-01-24T10:00:00.000Z",
    createdAt: "2024-01-22T10:00:00.000Z",
    updatedAt: "2024-01-22T10:00:00.000Z"
  }
}
```

---

### 2. Accept Team Invitation

**Endpoint**: `POST /api/v1/teamInvitations/accept`

**Authentication**: Required + User must be invitee

**Request Body**:
```javascript
{
  token: String,              // OR
  invitationId: String        // One of these is required
}
```

**Example Request (with token)**:
```bash
curl -X POST http://localhost:5000/api/v1/teamInvitations/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }'
```

**Example Request (with invitationId)**:
```bash
curl -X POST http://localhost:5000/api/v1/teamInvitations/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "invitationId": "507f1f77bcf86cd799439030"
  }'
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: {
    teamId: "507f1f77bcf86cd799439011",
    invitationId: "507f1f77bcf86cd799439030"
  }
}
```

**Side Effects**:
- Invitation status changed to "accepted"
- User added to team's members array with specified role
- Team owner notified of acceptance
- Notification created in database

---

### 3. Reject Team Invitation

**Endpoint**: `POST /api/v1/teamInvitations/reject`

**Authentication**: Required + User must be invitee

**Request Body**:
```javascript
{
  token: String,              // OR
  invitationId: String        // One of these is required
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/v1/teamInvitations/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "invitationId": "507f1f77bcf86cd799439030"
  }'
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: {
    invitationId: "507f1f77bcf86cd799439030"
  }
}
```

---

### 4. Get My Invitations

**Endpoint**: `GET /api/v1/teamInvitations/my`

**Authentication**: Required

**Query Parameters**: None

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/teamInvitations/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439030",
      team: {
        _id: "507f1f77bcf86cd799439011",
        name: "Summer Projects Team",
        productionHouse: "XYZ Productions"
      },
      invitedBy: {
        _id: "507f1f77bcf86cd799439012",
        name: "John Producer",
        email: "john@example.com"
      },
      project: {
        _id: "507f1f77bcf86cd799439020",
        name: "Monsoon Action Drama"
      },
      role: "Recruiter",
      status: "pending",
      token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      expiresAt: "2024-01-24T10:00:00.000Z",
      createdAt: "2024-01-22T10:00:00.000Z"
    }
  ]
}
```

---

## Casting APIs

### 1. Get All Castings

**Endpoint**: `GET /api/v1/casting`

**Authentication**: Optional

**Query Parameters**:
```
?experienceLevel=professional  // Filter by: beginner, intermediate, professional
?gender=male                    // Filter by: male, female, any
?location=mumbai               // Partial match search
?producer=507f1f77bcf86cd799439012  // Filter by producer ID
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/v1/casting?gender=male&experienceLevel=professional&location=goa" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  count: 5,
  data: [
    {
      _id: "507f1f77bcf86cd799439040",
      project: {
        _id: "507f1f77bcf86cd799439020",
        name: "Monsoon Action Drama",
        description: "An action-packed drama"
      },
      producer: {
        _id: "507f1f77bcf86cd799439012",
        name: "John Producer",
        email: "john@example.com"
      },
      roleTitle: "Lead Hero",
      description: "The protagonist of our story",
      ageRange: {
        min: 28,
        max: 38
      },
      genderRequirement: "male",
      experienceLevel: "professional",
      skillsRequired: ["Acting", "Martial Arts", "Horse Riding"],
      location: "Goa",
      numberOfOpenings: 1,
      submissionDeadline: "2024-05-25T23:59:59.000Z",
      auditionDate: "2024-05-29T10:00:00.000Z",
      shootStartDate: "2024-06-01T00:00:00.000Z",
      shootEndDate: "2024-08-15T00:00:00.000Z",
      status: "open",
      createdAt: "2024-01-22T10:00:00.000Z"
    }
    // ... more castings
  ]
}
```

---

### 2. Get Team Castings

**Endpoint**: `GET /api/v1/casting/team/:teamId`

**Authentication**: Required + User must be team member

**URL Parameters**:
- `teamId`: Team's ObjectId

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/casting/team/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  count: 5,
  data: [
    {
      // Casting call details (same as above)
    }
  ]
}
```

---

### 3. Get Producer Castings

**Endpoint**: `GET /api/v1/casting/producer`

**Authentication**: Required + User must be producer

**Example Request**:
```bash
curl -X GET http://localhost:5000/api/v1/casting/producer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response** (200 OK):
```javascript
{
  success: true,
  data: [
    {
      // All casting calls created by authenticated producer
      // Including both active and expired castings
    }
  ]
}
```

---

## Code Examples

### Frontend - React Example

#### Create Project with Roles

```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

function CreateProjectForm() {
  const [teamId, setTeamId] = useState('');
  const [projectData, setProjectData] = useState({
    name: '',
    genre: '',
    language: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    roles: [
      {
        roleName: '',
        roleType: 'Lead',
        ageMin: 18,
        ageMax: 60,
        gender: 'Any',
        skillsRequired: [],
        experienceLevel: 'Beginner',
        numberOfOpenings: 1
      }
    ]
  });

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/projects', {
        teamId,
        ...projectData
      });

      if (data.success) {
        alert('Project created successfully!');
        console.log('Created project:', data.data);
        // Redirect or update UI
      }
    } catch (error) {
      console.error('Error creating project:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <form onSubmit={handleCreateProject}>
      {/* Form fields here */}
    </form>
  );
}
```

#### Invite Team Member

```jsx
async function inviteTeamMember(teamId, inviteeEmail, role) {
  try {
    const { data } = await api.post('/teamInvitations', {
      teamId,
      inviteeEmail,
      role
    });

    if (data.success) {
      return {
        success: true,
        invitation: data.data,
        message: `Invitation sent to ${inviteeEmail}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to send invitation'
    };
  }
}

// Usage
const result = await inviteTeamMember(
  '507f1f77bcf86cd799439011',
  'recruiter@example.com',
  'Recruiter'
);

if (result.success) {
  console.log('Invitation token:', result.invitation.token);
}
```

#### Accept Invitation

```jsx
async function acceptInvitation(invitationId) {
  try {
    const { data } = await api.post('/teamInvitations/accept', {
      invitationId
    });

    if (data.success) {
      // Redirect to team page
      window.location.href = `/teams/${data.data.teamId}`;
    }
  } catch (error) {
    alert(error.response?.data?.message);
  }
}
```

#### Browse Castings

```jsx
async function searchCastings(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters);
    const { data } = await api.get(`/casting?${queryParams}`);

    return data.data; // Array of casting calls
  } catch (error) {
    console.error('Error fetching castings:', error);
    return [];
  }
}

// Usage
const castings = await searchCastings({
  gender: 'female',
  experienceLevel: 'professional',
  location: 'mumbai'
});
```

---

### Backend - Controller Example

#### Project Creation Controller

```javascript
exports.createProject = async (req, res) => {
  try {
    const { 
      teamId, 
      name, 
      genre, 
      language, 
      location, 
      startDate, 
      endDate, 
      description, 
      roles 
    } = req.body;

    // Validation
    if (!teamId || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'teamId and name are required' 
      });
    }

    // Authorization check
    const team = await ProductionTeam.findById(teamId);
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    const isTeamMember = String(team.owner) === String(req.user._id) || 
      team.members.some(m => String(m.user) === String(req.user._id));
    
    if (!isTeamMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized for this team' 
      });
    }

    // Create project
    const project = await FilmProject.create({
      team: team._id,
      name: name.trim(),
      genre: genre?.trim(),
      language: language?.trim(),
      location: location?.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description: description?.trim(),
      createdBy: req.user._id,
      collaborators: [req.user._id],
      roles: roles || []
    });

    // Auto-generate castings in background (non-blocking)
    if (roles && Array.isArray(roles) && roles.length > 0) {
      generateCastingsAsync(project, roles).catch(err => {
        console.error('Error auto-generating castings:', err);
      });
    }

    // Notify team members
    notifyTeamMembers(team, `New project "${project.name}" created`);

    res.status(201).json({ 
      success: true, 
      data: project 
    });
  } catch (err) {
    console.error('createProject error', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project' 
    });
  }
};
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```javascript
{
  success: false,
  message: "teamId and name are required"
}
```

#### 401 Unauthorized
```javascript
{
  success: false,
  message: "Not authenticated. Please log in."
}
```

#### 403 Forbidden
```javascript
{
  success: false,
  message: "Not authorized for this team"
}
```

#### 404 Not Found
```javascript
{
  success: false,
  message: "Team not found"
}
```

#### 500 Server Error
```javascript
{
  success: false,
  message: "Failed to create project"
}
```

---

## Database Queries

### Find User's Teams

```javascript
// Find all teams where user is owner or member
const teams = await ProductionTeam.find({
  $or: [
    { owner: userId },
    { 'members.user': userId }
  ]
}).sort({ createdAt: -1 });
```

### Find Team's Projects

```javascript
// Find all projects for a team
const projects = await FilmProject.find({ 
  team: teamId 
}).populate('createdBy');
```

### Find Castings with Filters

```javascript
// Find castings matching criteria
const castings = await CastingCall.find({
  experienceLevel: 'professional',
  genderRequirement: 'female',
  location: { $regex: 'mumbai', $options: 'i' },
  $and: [
    { auditionDate: { $gte: new Date() } },
    { submissionDeadline: { $gte: new Date() } }
  ]
}).populate('project').populate('producer');
```

### Find Pending Invitations for User

```javascript
// Get user's pending team invitations
const invitations = await TeamInvitation.find({
  invitee: userId,
  status: 'pending',
  expiresAt: { $gt: new Date() }
}).populate('team').populate('invitedBy');
```

### Find Team Invitation by Token

```javascript
// Verify and fetch invitation by token
const invitation = await TeamInvitation.findOne({
  token: token,
  status: 'pending',
  expiresAt: { $gt: new Date() }
}).populate('team');
```

---

## Summary

This guide covers:
- ✅ All Team, Project, Casting, and Invitation APIs
- ✅ Request/Response formats with real examples
- ✅ Frontend React code examples
- ✅ Backend controller examples
- ✅ Error handling patterns
- ✅ Database query examples

Reference this document while developing features or integrating with the Actory platform.
