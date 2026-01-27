# API Quick Reference Guide

Complete API reference for the Actory platform casting, project, and team management system.

---

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

---

## Authentication

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Get Token

**Login:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

## Casting Calls

### Get Active Castings (Public)

```http
GET /casting?experienceLevel=professional&location=mumbai
```

**Query Parameters:**
- `experienceLevel` - Filter by: `beginner`, `intermediate`, `professional`
- `genderRequirement` - Filter by: `male`, `female`, `any`, `other`
- `location` - Text search (case-insensitive)
- `producer` - Filter by producer ID

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60a7b...",
      "roleTitle": "Lead Actor",
      "description": "Looking for experienced actor...",
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
        "name": "Producer Name",
        "email": "producer@example.com"
      },
      "project": {
        "_id": "...",
        "name": "Film Title",
        "description": "..."
      }
    }
  ]
}
```

---

### Get Single Casting (Public)

```http
GET /casting/:id
```

**Response:** Same as casting object above

---

### Get Producer's Castings

```http
GET /casting/producer
Authorization: Bearer <token>
```

**Requirements:** Producer or ProductionTeam role

**Response:** Array of all castings created by logged-in user (past & future)

---

### Get Team Castings

```http
GET /casting/team/:teamId
Authorization: Bearer <token>
```

**Requirements:** Team member

**Response:** Array of all castings for team's projects

---

### Create Casting

```http
POST /casting
Authorization: Bearer <token>
Content-Type: application/json

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

**Requirements:** Producer or ProductionTeam role

**Validation Rules:**
- NOW < `submissionDeadline` < `auditionDate` < `shootStartDate` < `shootEndDate`
- `ageRange.max` >= `ageRange.min`
- `skills` array must have at least 1 item

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Update Casting

```http
PUT /casting/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleTitle": "Updated Title",
  "ageRange": { "min": 30, "max": 45 }
}
```

**Requirements:**
- Must be casting creator
- Submission deadline must NOT have passed

**Response:** Updated casting object

**Error Responses:**
```json
// 401 - Not creator
{
  "success": false,
  "message": "Not authorized to update this casting call"
}

// 400 - Deadline passed
{
  "success": false,
  "message": "Cannot update casting call after submission deadline has passed"
}
```

---

### Delete Casting

```http
DELETE /casting/:id
Authorization: Bearer <token>
```

**Requirements:**
- Must be casting creator
- Submission deadline must NOT have passed

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

---

## Projects

### Get Projects

```http
GET /projects?teamId=60a7b...
Authorization: Bearer <token>
```

**Query Parameters:**
- `teamId` - Filter by specific team (optional)

**Requirements:** Producer, ProductionTeam, or Admin role

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "team": {
        "_id": "...",
        "name": "Team Name",
        "owner": "...",
        "members": [...]
      },
      "name": "Film Project",
      "genre": "Drama",
      "language": "Hindi",
      "location": "Mumbai",
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-04-30T00:00:00Z",
      "description": "Project description...",
      "createdBy": {
        "_id": "...",
        "name": "Creator Name",
        "email": "creator@example.com"
      },
      "collaborators": [...],
      "roles": [
        {
          "_id": "...",
          "roleName": "Lead Actor",
          "roleType": "Lead",
          "ageMin": 25,
          "ageMax": 40,
          "gender": "Any",
          "skillsRequired": ["Acting", "Dancing"],
          "experienceLevel": "Professional",
          "roleDescription": "...",
          "numberOfOpenings": 1,
          "castingCallId": "..."
        }
      ],
      "status": "active",
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  ]
}
```

---

### Get Project by ID

```http
GET /projects/:id
Authorization: Bearer <token>
```

**Requirements:** Team member

**Response:** Single project object (same structure as above)

---

### Create Project

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "60a7b...",
  "name": "New Film Project",
  "genre": "Drama",
  "language": "Hindi",
  "location": "Mumbai",
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-04-30T00:00:00Z",
  "description": "Project description...",
  "roles": [
    {
      "roleName": "Lead Actor",
      "roleType": "Lead",
      "ageMin": 25,
      "ageMax": 40,
      "gender": "Any",
      "skillsRequired": ["Acting", "Dancing"],
      "experienceLevel": "Professional",
      "roleDescription": "Looking for experienced actor...",
      "numberOfOpenings": 1
    }
  ]
}
```

**Requirements:**
- Producer, ProductionTeam, or Admin role
- Team member

**Auto-Generated:**
- Casting calls for each role (background process)
- Creator added as collaborator
- `createdBy` set to current user

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Note:** Casting calls are created in background. Response returns immediately.

---

### Update Project

```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "status": "active",
  "roles": [...]
}
```

**Requirements:** Team member

**Allowed Updates:**
- `name`, `genre`, `language`, `location`
- `startDate`, `endDate`, `description`
- `status` (draft/active/archived)
- `roles` array

**Response:** Updated project object

---

### Delete Project

```http
DELETE /projects/:id
Authorization: Bearer <token>
```

**Requirements:** Project creator only (stricter than update)

**Cascade Behavior:**
- Deletes all related casting calls
- Notifies all team members

**Response:**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

---

### Add Role to Project

```http
POST /projects/:id/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": {
    "roleName": "Supporting Actor",
    "roleType": "Supporting",
    "ageMin": 20,
    "ageMax": 35,
    "gender": "Female",
    "skillsRequired": ["Acting"],
    "experienceLevel": "Intermediate",
    "roleDescription": "Looking for supporting actress...",
    "numberOfOpenings": 1
  }
}
```

**Requirements:** Team member

**Response:** Updated project with new role

---

### Create Casting from Role

```http
POST /projects/:id/roles/:roleId/casting
Authorization: Bearer <token>
Content-Type: application/json

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

**Requirements:** Team member

**Response:**
```json
{
  "success": true,
  "data": { ... casting object ... }
}
```

---

## Teams

### Get My Teams

```http
GET /teams
Authorization: Bearer <token>
```

**Requirements:** Producer, ProductionTeam, or Admin role

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Production Team Alpha",
      "productionHouse": "Alpha Studios",
      "description": "Team description...",
      "owner": "...",
      "members": [
        {
          "user": "...",
          "role": "Owner",
          "addedAt": "2026-01-15T10:00:00Z"
        },
        {
          "user": "...",
          "role": "Recruiter",
          "addedAt": "2026-01-16T12:00:00Z"
        }
      ],
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

### Get Team by ID

```http
GET /teams/:id
Authorization: Bearer <token>
```

**Requirements:** Team member

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Production Team Alpha",
    "productionHouse": "Alpha Studios",
    "description": "Team description...",
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
          "role": "Producer",
          "profileImage": "..."
        },
        "role": "Recruiter",
        "addedAt": "2026-01-16T12:00:00Z"
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-20T14:30:00Z"
  }
}
```

**Note:** Handles both User and ProductionHouse members

---

### Create Team

```http
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Production Team",
  "productionHouse": "Studio Name",
  "description": "Team description..."
}
```

**Requirements:** Producer, ProductionTeam, or Admin role

**Auto-Generated:**
- Creator becomes owner
- Creator added to members with role 'Owner'

**Response:**
```json
{
  "success": true,
  "data": { ... team object ... }
}
```

---

### Update Team

```http
PUT /teams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Team Name",
  "description": "Updated description..."
}
```

**Requirements:** Team owner only

**Allowed Updates:**
- `name`, `productionHouse`, `description`

**Not Allowed:**
- Owner change
- Member management (use separate endpoints)

**Response:** Updated team object

---

### Remove Member from Team

```http
DELETE /teams/:id/members/:memberId
Authorization: Bearer <token>
```

**Requirements:** Team owner only

**Restrictions:**
- Cannot remove owner
- Only owner can remove members

**Response:**
```json
{
  "success": true,
  "data": { ... updated team ... }
}
```

**Notifications:** Removed member receives notification

---

### Leave Team

```http
POST /teams/:id/leave
Authorization: Bearer <token>
```

**Requirements:** Any team member (except owner)

**Restrictions:**
- Owner cannot leave (must delete team instead)

**Response:**
```json
{
  "success": true,
  "data": { ... updated team ... }
}
```

**Notifications:** Owner receives notification

---

## Team Invitations

### Send Invitation

```http
POST /team-invitations/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "60a7b...",
  "inviteeEmail": "newmember@example.com",
  "role": "Recruiter",
  "projectId": "optional-project-id"
}
```

**Alternative (using user ID):**
```json
{
  "teamId": "60a7b...",
  "inviteeId": "60a7c...",
  "role": "Viewer"
}
```

**Requirements:** Team owner only

**Validation:**
- Invitee must exist
- Invitee cannot already be team member
- Role must be 'Recruiter' or 'Viewer'

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "team": "...",
    "invitedBy": "...",
    "invitee": "...",
    "role": "Recruiter",
    "status": "pending",
    "token": "a1b2c3d4e5f6...",
    "expiresAt": "2026-01-25T10:00:00Z",
    "createdAt": "2026-01-23T10:00:00Z"
  }
}
```

**Notifications:** Invitee receives notification

**Expiration:** 48 hours from creation

---

### Accept Invitation

```http
POST /team-invitations/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6..."
}
```

**Alternative (using invitation ID):**
```json
{
  "invitationId": "60a7d..."
}
```

**Requirements:** Must be the invitee

**Validation:**
- Invitation must be pending
- Must not be expired
- User must match invitee

**Response:**
```json
{
  "success": true,
  "data": {
    "teamId": "60a7b...",
    "invitationId": "60a7d..."
  }
}
```

**Side Effects:**
- User added to team with specified role
- Invitation status changed to 'accepted'
- Inviter receives notification

---

### Reject Invitation

```http
POST /team-invitations/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6..."
}
```

**Alternative (using invitation ID):**
```json
{
  "invitationId": "60a7d..."
}
```

**Requirements:** Must be the invitee

**Response:**
```json
{
  "success": true,
  "data": {
    "invitationId": "60a7d..."
  }
}
```

**Side Effects:**
- Invitation status changed to 'rejected'
- Inviter receives notification

---

### Get Pending Invitations

```http
GET /team-invitations/pending
Authorization: Bearer <token>
```

**Requirements:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "team": {
        "_id": "...",
        "name": "Team Name"
      },
      "invitedBy": "...",
      "invitee": "...",
      "role": "Recruiter",
      "status": "pending",
      "token": "...",
      "expiresAt": "2026-01-25T10:00:00Z",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error Format

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Age range min must be at least 1",
    "Submission deadline must be in the future"
  ]
}
```

### Common Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error, missing fields, deadline passed |
| 401 | Unauthorized | Not authenticated, invalid token |
| 403 | Forbidden | Not authorized for resource, wrong role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, unexpected error |

---

## Date Formats

All dates use **ISO 8601 format**:

```
2026-02-15T10:00:00Z
2026-02-15T10:00:00.000Z
2026-02-15T10:00:00+05:30
```

**Important:** Always ensure date order:
```
NOW < submissionDeadline < auditionDate < shootStartDate < shootEndDate
```

---

## Pagination

Currently not implemented. All list endpoints return full results.

**Future Enhancement:**
```http
GET /casting?page=1&limit=20
```

---

## Rate Limiting

Currently not implemented.

**Future Enhancement:**
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

---

## WebSocket Support

Currently not implemented.

**Future Enhancement:**
- Real-time notifications
- Live casting updates
- Team collaboration events

---

## Testing Endpoints

### Health Check

```http
GET /health

Response:
{
  "success": true,
  "message": "API is running"
}
```

### Test Authentication

```http
GET /auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Producer",
    ...
  }
}
```

---

## Best Practices

### 1. Always Include Authorization Header

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 2. Handle Errors Gracefully

```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!data.success) {
    // Handle error
    console.error(data.message);
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
}
```

### 3. Validate Dates Client-Side

```javascript
const isValidDateOrder = (submission, audition, shootStart, shootEnd) => {
  const now = new Date();
  return now < submission && 
         submission < audition && 
         audition < shootStart && 
         shootStart < shootEnd;
};
```

### 4. Cache User and Team Data

```javascript
// Cache team memberships
const userTeams = await fetchMyTeams();
localStorage.setItem('userTeams', JSON.stringify(userTeams));

// Check cache before API call
const cachedTeams = localStorage.getItem('userTeams');
if (cachedTeams) {
  teams = JSON.parse(cachedTeams);
}
```

### 5. Show Loading States

```javascript
const [loading, setLoading] = useState(false);

const fetchCastings = async () => {
  setLoading(true);
  try {
    const data = await getCastings();
    setCastings(data);
  } finally {
    setLoading(false);
  }
};
```

---

## Code Examples

### JavaScript (Fetch)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
  }
  return data;
};

// Get Castings
const getCastings = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `http://localhost:5000/api/v1/casting?${params}`
  );
  return await response.json();
};

// Create Project
const createProject = async (projectData, token) => {
  const response = await fetch('http://localhost:5000/api/v1/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });
  return await response.json();
};
```

### Python (Requests)

```python
import requests

# Login
def login(email, password):
    response = requests.post(
        'http://localhost:5000/api/v1/auth/login',
        json={'email': email, 'password': password}
    )
    return response.json()

# Get Castings
def get_castings(filters=None):
    response = requests.get(
        'http://localhost:5000/api/v1/casting',
        params=filters or {}
    )
    return response.json()

# Create Casting
def create_casting(casting_data, token):
    response = requests.post(
        'http://localhost:5000/api/v1/casting',
        headers={'Authorization': f'Bearer {token}'},
        json=casting_data
    )
    return response.json()
```

---

## Postman Collection

### Import Collection

Save this JSON as `actory-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Actory API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Castings",
      "item": [
        {
          "name": "Get Active Castings",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/casting"
          }
        },
        {
          "name": "Create Casting",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/casting",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"roleTitle\": \"Lead Actor\",\n  \"description\": \"Looking for experienced actor\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## Support

For issues or questions:
- GitHub: [tonyjoy0303/Actory](https://github.com/tonyjoy0303/Actory)
- Email: support@actory.com
- Documentation: See `CASTING_PROJECT_SYSTEM.md` and `AUTHORIZATION_TEAM_COLLABORATION.md`

---

**Last Updated:** January 23, 2026
